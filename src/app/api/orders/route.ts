import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/connection";
import { Order, IOrderDocument } from "@/models/order.model";
import { Payment } from "@/models/payment.model";
import { Product } from "@/models/product.model";
import { User } from "@/models/user.model";
import { Coupon } from "@/models/coupon.model";
import { StoreSettings } from "@/models/store-settings.model";
import { getServerSession } from "@/lib/auth/session";
import { PAYMENT_STATUS, PAYMENT_METHODS, ORDER_STATUS } from "@/constants";
import { sendEmail } from "@/lib/email/mailer";
import { orderConfirmationTemplate } from "@/lib/email/templates";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

function generateOrderNumber(): string {
  return "SUN" + Date.now().toString().slice(-7) + Math.floor(100 + Math.random() * 900);
}

function generatePaymentRef(): string {
  return "PAY" + Date.now().toString().slice(-9) + Math.floor(10 + Math.random() * 90);
}

async function getRazorpay() {
  const RazorpayLib = (await import("razorpay")).default;
  return new RazorpayLib({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

// ── POST — Place order ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user)
    return NextResponse.json({ error: "Please sign in to place an order." }, { status: 401 });

  const body = await req.json();
  const {
    items,
    shippingAddress,
    paymentMethod,
    couponCode,
    couponDiscount,
    shippingFee,
    total,
  } = body;

  if (!items?.length || !shippingAddress || !paymentMethod || total == null)
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

  await connectDB();

  // ── Server-side price & stock validation ────────────────────────────────────
  const productIds = (items as Array<{ productId: string; quantity: number }>).map((i) => i.productId);
  const dbProducts = await Product.find({ _id: { $in: productIds }, isActive: true, deletedAt: null })
    .select("_id basePrice stock variants")
    .lean<Array<{
      _id: unknown;
      basePrice: number;
      stock: number;
      variants?: Array<{ size?: string; color?: string; price?: number; stock?: number }>;
    }>>();

  const dbProductMap = new Map(dbProducts.map((p) => [String(p._id), p]));

  const validatedItems: Array<{
    productId: string; name: string; image: string; slug: string;
    price: number; compareAtPrice?: number; quantity: number;
    variant?: { size?: string; color?: string };
    status: string;
  }> = [];

  for (const item of items as Array<{
    productId: string; name: string; image: string; slug: string;
    price: number; compareAtPrice?: number; quantity: number;
    selectedSize?: string; selectedColor?: string; variant?: { size?: string; color?: string };
  }>) {
    const dbProduct = dbProductMap.get(item.productId);
    if (!dbProduct)
      return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });

    const size = item.selectedSize || item.variant?.size;
    const color = (item as unknown as { selectedColor?: string }).selectedColor || item.variant?.color;

    const matchedVariant = dbProduct.variants?.find(
      (v) =>
        (!size || String(v.size ?? "").trim() === String(size ?? "").trim()) &&
        (!color || String(v.color ?? "").trim() === String(color ?? "").trim())
    );
    const itemPrice = matchedVariant?.price != null && matchedVariant.price > 0 ? matchedVariant.price : dbProduct.basePrice;
    const itemStock = matchedVariant?.stock != null ? matchedVariant.stock : dbProduct.stock;

    if (itemStock < item.quantity)
      return NextResponse.json({ error: `"${item.name}" is out of stock.` }, { status: 400 });

    validatedItems.push({
      ...item,
      price: itemPrice,
      variant: {
        ...(size ? { size } : {}),
        ...(color ? { color } : {}),
      },
      status: ORDER_STATUS.CONFIRMED,
    });
  }

  const storeSettings = await StoreSettings.findOne().lean();
  const freeAboveThreshold = storeSettings?.shipping?.freeAbove ?? 999;
  const configuredStandardFee = storeSettings?.shipping?.standardFee ?? 99;

  const validatedSubtotal = validatedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const validatedShipping = validatedSubtotal >= freeAboveThreshold ? 0 : configuredStandardFee;
  let validatedDiscount = 0;
  let verifiedCouponCode: string | undefined = undefined;

  if (couponCode) {
    const codeStr = String(couponCode).toUpperCase().trim();
    const coupon = await Coupon.findOne({
      code: codeStr,
      isActive: true,
      deletedAt: null,
      startDate: { $lte: new Date() },
      endDate:   { $gte: new Date() },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 400 });
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "This coupon has reached its total usage limit." }, { status: 400 });
    }

    if (coupon.userLimit != null) {
      const userLimit = coupon.userLimit;
      const currentUserId = session.user._id;
      const userUsageInOrders = await Order.countDocuments({
        userId: currentUserId,
        couponCode: coupon.code,
        status: { $ne: "cancelled" },
      });
      const userUsageInArray = (coupon.usedBy ?? []).filter((id) => String(id) === String(currentUserId)).length;
      const totalUserUsage = Math.max(userUsageInOrders, userUsageInArray);

      if (totalUserUsage >= userLimit) {
        return NextResponse.json({ error: "You have already reached the usage limit for this coupon code." }, { status: 400 });
      }
    }

    if (coupon.minOrderAmount && validatedSubtotal < coupon.minOrderAmount) {
      return NextResponse.json({ error: `Minimum order of ₹${coupon.minOrderAmount} required for coupon ${coupon.code}.` }, { status: 400 });
    }

    if (coupon.type === "percentage") {
      validatedDiscount = Math.round((validatedSubtotal * coupon.value) / 100);
      if (coupon.maxDiscountAmount) validatedDiscount = Math.min(validatedDiscount, coupon.maxDiscountAmount);
    } else if (coupon.type === "flat") {
      validatedDiscount = Math.min(coupon.value, validatedSubtotal);
    } else if (coupon.type === "free_shipping") {
      validatedDiscount = 99;
    }

    verifiedCouponCode = coupon.code;
  }

  const validatedTotal = Math.max(0, validatedSubtotal + validatedShipping - validatedDiscount);
  const orderNumber    = generateOrderNumber();

  // ── COD ────────────────────────────────────────────────────────────────────
  if (paymentMethod === "cod") {
    const order = await Order.create({
      orderNumber,
      userId:         session.user._id,
      items:          validatedItems,
      shippingAddress: { ...shippingAddress, country: "India", type: "home" },
      paymentMethod:  PAYMENT_METHODS.COD,
      paymentStatus:  PAYMENT_STATUS.PENDING,
      status:         ORDER_STATUS.CONFIRMED,
      subtotal:       validatedSubtotal,
      couponCode:     verifiedCouponCode,
      couponDiscount: validatedDiscount,
      discount:       validatedDiscount,
      shippingFee:    validatedShipping,
      tax:            0,
      total:          validatedTotal,
      timeline: [{ status: ORDER_STATUS.CONFIRMED, timestamp: new Date(), message: "Order placed via Cash on Delivery." }],
      estimatedDelivery: new Date(Date.now() + 5 * 86400000),
    });

    if (verifiedCouponCode) {
      await Coupon.updateOne(
        { code: verifiedCouponCode },
        { $inc: { usageCount: 1 }, $push: { usedBy: session.user._id } }
      ).catch((e) => console.error("[Coupon usage update failed]", e));
    }

    // Create a payment record for COD orders too (for completeness)
    await Payment.create({
      paymentRef:    generatePaymentRef(),
      orderId:       order._id,
      orderNumber,
      userId:        session.user._id,
      amount:        validatedTotal,
      currency:      "INR",
      paymentMethod: PAYMENT_METHODS.COD,
      gatewayName:   "cod",
      status:        "pending",
      logs: [{ action: "Payment record created for COD order", performedBy: "system", at: new Date() }],
    });

    // Decrement stock
    await Promise.all(
      validatedItems.map((item) =>
        Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
          .catch((e: unknown) => console.error("[Stock] decrement failed for", item.productId, e))
      )
    );

    // Send notification emails (to Customer and Admin)
    sendOrderNotifications(order, session.user!.email).catch((e) => console.error("[Order notification emails] COD failed:", e));

    return NextResponse.json({ success: true, orderNumber: order.orderNumber, orderId: String(order._id) }, { status: 201 });
  }

  // ── Razorpay ────────────────────────────────────────────────────────────────
  if (paymentMethod === "razorpay") {
    const dbOrder = await Order.create({
      orderNumber,
      userId:         session.user._id,
      items:          validatedItems,
      shippingAddress: { ...shippingAddress, country: "India", type: "home" },
      paymentMethod:  PAYMENT_METHODS.RAZORPAY,
      paymentStatus:  PAYMENT_STATUS.PENDING,
      status:         ORDER_STATUS.PENDING,
      subtotal:       validatedSubtotal,
      couponCode:     verifiedCouponCode,
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
        amount:   Math.round(validatedTotal * 100),
        currency: "INR",
        receipt:  orderNumber,
        notes:    { orderId: String(dbOrder._id), orderNumber },
      });

      // Create payment record
      const payment = await Payment.create({
        paymentRef:      generatePaymentRef(),
        orderId:         dbOrder._id,
        orderNumber,
        userId:          session.user._id,
        amount:          validatedTotal,
        currency:        "INR",
        paymentMethod:   PAYMENT_METHODS.RAZORPAY,
        gatewayName:     "razorpay",
        gatewayOrderId:  rzpOrder.id,
        status:          "pending",
        logs: [{ action: "Razorpay order created", performedBy: "system", at: new Date() }],
      });

      // Link payment to order
      await Order.findByIdAndUpdate(dbOrder._id, {
        razorpayOrderId: rzpOrder.id,
        paymentId: payment._id,
      });

      return NextResponse.json({
        success:         true,
        orderId:         String(dbOrder._id),
        orderNumber,
        razorpayOrderId: rzpOrder.id,
        amount:          rzpOrder.amount,
        currency:        rzpOrder.currency,
        keyId:           process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      }, { status: 201 });
    } catch (err) {
      await Order.findByIdAndDelete(dbOrder._id);
      console.error("[Razorpay] order create error:", err);
      return NextResponse.json({ error: "Payment gateway error. Please try again." }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
}

// ── PUT — Client-side payment verification (fallback when webhook hasn't arrived) ──

export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session.isAuthenticated)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();
  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature)
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });

  await connectDB();

  const existingOrder = await Order.findOne({
    _id:             orderId,
    userId:          session.user!._id,
    razorpayOrderId: razorpayOrderId,
  }).lean();

  if (!existingOrder)
    return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // If webhook already confirmed this payment — return success immediately
  if (existingOrder.paymentStatus === PAYMENT_STATUS.PAID) {
    return NextResponse.json({ success: true, orderNumber: existingOrder.orderNumber, status: "confirmed" });
  }

  // If already set to pending_verification by an earlier client attempt — do not re-verify
  if (existingOrder.paymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION) {
    return NextResponse.json({ success: true, orderNumber: existingOrder.orderNumber, status: "pending_verification" });
  }

  // Verify Razorpay HMAC signature
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  let sigValid = false;
  try {
    sigValid = crypto.timingSafeEqual(
      Buffer.from(expectedSig, "hex"),
      Buffer.from(razorpaySignature, "hex")
    );
  } catch {
    sigValid = false;
  }

  // Find or locate the payment record
  const payment = await Payment.findOne({ orderId: existingOrder._id });

  const attemptEntry = {
    attemptedAt:      new Date(),
    source:           "client" as const,
    gatewayPaymentId: razorpayPaymentId,
    signature:        razorpaySignature,
    status:           sigValid ? "signature_valid" : "signature_invalid",
  };

  if (sigValid) {
    // ── Signature valid → confirm order ──────────────────────────────────────
    const [order] = await Promise.all([
      Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            razorpayPaymentId,
            razorpaySignature,
            paymentStatus: PAYMENT_STATUS.PAID,
            status:        ORDER_STATUS.CONFIRMED,
          },
          $push: {
            timeline: {
              status:    ORDER_STATUS.CONFIRMED,
              timestamp: new Date(),
              message:   `Payment confirmed via client verification. Payment ID: ${razorpayPaymentId}`,
            },
          },
        },
        { new: true }
      ),
      payment && Payment.findByIdAndUpdate(payment._id, {
        $set:  { gatewayPaymentId: razorpayPaymentId, signature: razorpaySignature, status: "success" },
        $push: {
          attempts: attemptEntry,
          logs:     { action: "Payment confirmed via client signature verification", performedBy: "system", at: new Date() },
        },
      }),
    ]);

    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    // Decrement stock & increment coupon usage
    await Promise.all([
      ...(order.items as unknown as Array<{ productId: unknown; quantity: number }>).map((item) =>
        Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
          .catch((e: unknown) => console.error("[Stock] decrement failed for", item.productId, e))
      ),
      order.couponCode
        ? Coupon.updateOne(
            { code: order.couponCode },
            { $inc: { usageCount: 1 }, $push: { usedBy: session.user!._id } }
          ).catch((e) => console.error("[Coupon usage update failed]", e))
        : Promise.resolve(),
    ]);

    // Send notification emails (to Customer and Admin)
    sendOrderNotifications(order, session.user!.email).catch((e) => console.error("[Order notification emails] failed:", e));

    return NextResponse.json({ success: true, orderNumber: order.orderNumber, status: "confirmed" });
  }

  // ── Signature invalid — payment handler was called so money may have been deducted ──
  // Mark as pending_verification; admin will verify via Razorpay dashboard
  await Promise.all([
    Order.findByIdAndUpdate(orderId, {
      $set: { paymentStatus: PAYMENT_STATUS.PENDING_VERIFICATION, razorpayPaymentId },
      $push: {
        timeline: {
          status:    ORDER_STATUS.PENDING,
          timestamp: new Date(),
          message:   `Payment verification pending. Gateway ID: ${razorpayPaymentId}. Admin will verify manually.`,
        },
      },
    }),
    payment && Payment.findByIdAndUpdate(payment._id, {
      $set:  { gatewayPaymentId: razorpayPaymentId, status: "pending_verification" },
      $push: {
        attempts: attemptEntry,
        logs:     { action: "Signature verification failed; marked pending_verification for admin review", performedBy: "system", at: new Date() },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    orderNumber: existingOrder.orderNumber,
    status: "pending_verification",
  });
}

async function sendOrderNotifications(order: IOrderDocument | null, customerEmail: string) {
  if (!order) return;

  // 1. Send confirmation email to Customer
  if (customerEmail) {
    sendOrderEmail(order, customerEmail, false).catch((e) => console.error("[Customer Order Email] failed:", e));
  }

  // 2. Send new order notification email to Admin
  try {
    const adminUsers = await User.find({ role: "admin", isActive: true }).select("email").lean();
    const adminEmails = adminUsers.map((u) => u.email).filter(Boolean);
    const fallbackAdmin = process.env.ADMIN_EMAIL ?? "admin@sunera.in";
    const targetAdmins = Array.from(new Set([...adminEmails, fallbackAdmin]));

    for (const adminEmail of targetAdmins) {
      sendOrderEmail(order, adminEmail, true).catch((e) => console.error("[Admin Order Email] failed:", e));
    }
  } catch (e) {
    console.error("[Admin Order Email lookup failed]", e);
  }
}

async function sendOrderEmail(order: IOrderDocument | null, toEmail: string, isForAdmin = false) {
  if (!order || !toEmail) return;

  let displayName = "Valued Customer";
  try {
    const user = await User.findById(order.userId).select("name").lean();
    if (user?.name) displayName = user.name;
  } catch { /* non-fatal */ }
  const addr = order.shippingAddress as Record<string, string>;
  if (displayName === "Valued Customer" && addr.name) displayName = addr.name;

  const eta = order.estimatedDelivery
    ? new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "4–7 business days";

  const orderDate = new Date(order.createdAt as Date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const subject = isForAdmin
    ? `🚨 New Order Received – #${order.orderNumber} | SunEra Admin`
    : `Order Confirmed – ${order.orderNumber} | SunEra Lifestyle`;

  await sendEmail({
    to:      toEmail,
    subject,
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
      trackUrl:      isForAdmin ? `${BASE_URL}/admin/orders` : `${BASE_URL}/account/orders`,
    }),
  });
}
