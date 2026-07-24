import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/connection";
import { Order, IOrderDocument } from "@/models/order.model";
import { Product } from "@/models/product.model";
import { User } from "@/models/user.model";
import { getServerSession } from "@/lib/auth/session";
import { PAYMENT_STATUS, PAYMENT_METHODS, ORDER_STATUS } from "@/constants";
import { sendEmail } from "@/lib/email/mailer";
import { orderConfirmationTemplate } from "@/lib/email/templates";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

function generateOrderNumber(): string {
  return "SUN" + Date.now().toString().slice(-7) + Math.floor(100 + Math.random() * 900);
}

// Lazily import Razorpay so the server doesn't crash if the package is absent
async function getRazorpay() {
  const RazorpayLib = (await import("razorpay")).default;
  return new RazorpayLib({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user)
    return NextResponse.json({ error: "Please sign in to place an order." }, { status: 401 });

  const body = await req.json();
  const {
    items,            // [{ productId, name, image, slug, price, quantity }]
    shippingAddress,  // { name, phone, addressLine1, addressLine2, city, state, pincode }
    paymentMethod,    // "cod" | "razorpay"
    subtotal,
    couponCode,
    couponDiscount,
    shippingFee,
    total,
  } = body;

  if (!items?.length || !shippingAddress || !paymentMethod || total == null)
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

  await connectDB();

  // ── SERVER-SIDE PRICE VALIDATION ───────────────────────────────────────────
  // Never trust client-submitted prices. Fetch real prices from DB and recalculate.
  const productIds = (items as Array<{ productId: string; quantity: number }>).map((i) => i.productId);
  const dbProducts = await Product.find({ _id: { $in: productIds }, isActive: true, deletedAt: null })
    .select("_id basePrice stock")
    .lean<Array<{ _id: unknown; basePrice: number; stock: number }>>();

  const priceMap = new Map(dbProducts.map((p) => [String(p._id), p.basePrice]));
  const stockMap = new Map(dbProducts.map((p) => [String(p._id), p.stock]));

  const validatedItems: Array<{ productId: string; name: string; image: string; slug: string; price: number; compareAtPrice?: number; quantity: number }> = [];
  for (const item of items as Array<{ productId: string; name: string; image: string; slug: string; price: number; compareAtPrice?: number; quantity: number }>) {
    const dbPrice = priceMap.get(item.productId);
    if (dbPrice === undefined)
      return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });

    const available = stockMap.get(item.productId) ?? 0;
    if (available < item.quantity)
      return NextResponse.json({ error: `"${item.name}" is out of stock.` }, { status: 400 });

    validatedItems.push({ ...item, price: dbPrice }); // overwrite with DB price
  }

  const validatedSubtotal  = validatedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const validatedShipping  = shippingFee ?? 0;
  const validatedDiscount  = couponDiscount ?? 0;
  const validatedTotal     = validatedSubtotal + validatedShipping - validatedDiscount;

  const orderNumber = generateOrderNumber();

  // ── For COD: create order immediately ─────────────────────────────────────
  if (paymentMethod === "cod") {
    const order = await Order.create({
      orderNumber,
      userId: session.user._id,
      items: validatedItems,
      shippingAddress: { ...shippingAddress, country: "India", type: "home" },
      paymentMethod: PAYMENT_METHODS.COD,
      paymentStatus: PAYMENT_STATUS.PENDING,
      status: ORDER_STATUS.CONFIRMED,
      subtotal:       validatedSubtotal,
      couponCode:     couponCode   ?? undefined,
      couponDiscount: validatedDiscount,
      discount:       validatedDiscount,
      shippingFee:    validatedShipping,
      tax:            0,
      total:          validatedTotal,
      timeline: [{ status: ORDER_STATUS.CONFIRMED, timestamp: new Date(), message: "Order placed via Cash on Delivery." }],
      estimatedDelivery: new Date(Date.now() + 5 * 86400000),
    });

    // Decrement stock atomically
    await Promise.all(
      validatedItems.map((item) =>
        Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
          .catch((e: unknown) => console.error("[Stock] decrement failed for", item.productId, e))
      )
    );

    return NextResponse.json({ success: true, orderNumber: order.orderNumber, orderId: String(order._id) }, { status: 201 });
  }

  // ── For Razorpay: create DB order (pending) + Razorpay order ──────────────
  if (paymentMethod === "razorpay") {
    const dbOrder = await Order.create({
      orderNumber,
      userId: session.user._id,
      items: validatedItems,
      shippingAddress: { ...shippingAddress, country: "India", type: "home" },
      paymentMethod: PAYMENT_METHODS.RAZORPAY,
      paymentStatus: PAYMENT_STATUS.PENDING,
      status: ORDER_STATUS.PENDING,
      subtotal:       validatedSubtotal,
      couponCode:     couponCode   ?? undefined,
      couponDiscount: validatedDiscount,
      discount:       validatedDiscount,
      shippingFee:    validatedShipping,
      tax:            0,
      total:          validatedTotal,
      timeline: [{ status: ORDER_STATUS.PENDING, timestamp: new Date(), message: "Order initiated, awaiting online payment." }],
      estimatedDelivery: new Date(Date.now() + 5 * 86400000),
    });

    try {
      const rzp = await getRazorpay();
      const rzpOrder = await rzp.orders.create({
        amount:   Math.round(total * 100), // paise
        currency: "INR",
        receipt:  orderNumber,
        notes:    { orderId: String(dbOrder._id), orderNumber },
      });

      // Store razorpay order id
      await Order.findByIdAndUpdate(dbOrder._id, { razorpayOrderId: rzpOrder.id });

      return NextResponse.json({
        success:        true,
        orderId:        String(dbOrder._id),
        orderNumber,
        razorpayOrderId: rzpOrder.id,
        amount:         rzpOrder.amount,
        currency:       rzpOrder.currency,
        keyId:          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      }, { status: 201 });
    } catch (err) {
      // Razorpay order creation failed — delete the DB order to avoid orphans
      await Order.findByIdAndDelete(dbOrder._id);
      console.error("[Razorpay] order create error:", err);
      return NextResponse.json({ error: "Payment gateway error. Please try again." }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
}

// Verify Razorpay payment signature (inline for simplicity)
export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session.isAuthenticated)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();
  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature)
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });

  await connectDB();

  // Verify the order exists, belongs to this user, and the razorpayOrderId matches
  const existingOrder = await Order.findOne({
    _id:             orderId,
    userId:          session.user!._id,
    razorpayOrderId: razorpayOrderId,
    paymentStatus:   PAYMENT_STATUS.PENDING,
  }).lean();

  if (!existingOrder)
    return NextResponse.json({ error: "Order not found or already processed." }, { status: 404 });

  // Verify Razorpay signature
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(expectedSig, "hex"), Buffer.from(razorpaySignature, "hex")))
    return NextResponse.json({ error: "Payment signature invalid. Please contact support." }, { status: 400 });

  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      $set: {
        razorpayPaymentId,
        razorpaySignature,
        paymentStatus: PAYMENT_STATUS.PAID,
        status: ORDER_STATUS.CONFIRMED,
      },
      $push: {
        timeline: {
          status: ORDER_STATUS.CONFIRMED,
          timestamp: new Date(),
          message: `Payment confirmed via Razorpay. Payment ID: ${razorpayPaymentId}`,
        },
      },
    },
    { new: true }
  );

  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Decrement stock atomically now that payment is confirmed
  await Promise.all(
    (order.items as unknown as Array<{ productId: unknown; quantity: number }>).map((item) =>
      Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
        .catch((e: unknown) => console.error("[Stock] decrement failed for", item.productId, e))
    )
  );

  // Send confirmation email (non-blocking)
  sendOrderEmail(order, session.user!.email).catch((e) =>
    console.error("[Order email] failed:", e)
  );

  return NextResponse.json({ success: true, orderNumber: order.orderNumber });
}

async function sendOrderEmail(order: IOrderDocument | null, toEmail: string) {
  if (!order || !toEmail) return;

  // Get display name: try DB, fall back to shipping address name
  let displayName = "Valued Customer";
  try {
    const user = await User.findById(order.userId).select("name").lean();
    if (user?.name) displayName = user.name;
  } catch {
    // non-fatal — use shipping address name
  }
  const addr = order.shippingAddress as Record<string, string>;
  if (displayName === "Valued Customer" && addr.name) displayName = addr.name;

  const eta = order.estimatedDelivery
    ? new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "4–7 business days";

  const orderDate = new Date(order.createdAt as Date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  await sendEmail({
    to:      toEmail,
    subject: `Order Confirmed – ${order.orderNumber} | SunEra Lifestyle`,
    html:    orderConfirmationTemplate({
      name:              displayName,
      orderNumber:       order.orderNumber,
      orderDate,
      estimatedDelivery: eta,
      items:             (order.items as unknown as Array<Record<string, unknown>>).map((i) => ({
        name:     String(i.name ?? ""),
        image:    String(i.image ?? ""),
        quantity: Number(i.quantity ?? 1),
        price:    Number(i.price ?? 0),
      })),
      subtotal:       order.subtotal,
      shippingFee:    order.shippingFee,
      couponDiscount: order.couponDiscount,
      couponCode:     order.couponCode,
      total:          order.total,
      shippingAddress: {
        name:         addr.name ?? "",
        addressLine1: addr.addressLine1 ?? "",
        city:         addr.city ?? "",
        state:        addr.state ?? "",
        pincode:      addr.pincode ?? "",
      },
      paymentMethod: order.paymentMethod,
      trackUrl:      `${BASE_URL}/account/orders`,
    }),
  });
}
