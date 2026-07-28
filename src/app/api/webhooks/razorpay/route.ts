import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/connection";
import { Order } from "@/models/order.model";
import { Payment } from "@/models/payment.model";
import { Product } from "@/models/product.model";
import { User } from "@/models/user.model";
import { Coupon } from "@/models/coupon.model";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/constants";
import { sendEmail } from "@/lib/email/mailer";
import { orderConfirmationTemplate, orderStatusTemplate } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Razorpay signs webhooks with HMAC-SHA256 of the raw body using the webhook secret
function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody  = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.warn("[Webhook] Invalid signature received");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event as string;
  const entity = (payload.payload as Record<string, unknown>)?.payment as Record<string, unknown> | undefined;
  const paymentEntity = entity?.entity as Record<string, unknown> | undefined;

  if (!paymentEntity) {
    // Not a payment event we care about — acknowledge silently
    return NextResponse.json({ received: true });
  }

  const gatewayOrderId   = paymentEntity.order_id as string | undefined;
  const gatewayPaymentId = paymentEntity.id as string | undefined;
  const transactionRef   = (paymentEntity.acquirer_data as Record<string, string> | undefined)?.rrn;

  await connectDB();

  // Find the Payment record by Razorpay order_id
  const payment = await Payment.findOne({ gatewayOrderId });
  if (!payment) {
    console.warn("[Webhook] No payment record for gatewayOrderId:", gatewayOrderId);
    return NextResponse.json({ received: true });
  }

  const order = await Order.findById(payment.orderId);
  if (!order) {
    console.warn("[Webhook] No order for payment:", String(payment._id));
    return NextResponse.json({ received: true });
  }

  // Always record the raw webhook payload
  const attemptEntry = {
    attemptedAt:      new Date(),
    source:           "webhook" as const,
    gatewayPaymentId: gatewayPaymentId ?? "",
    status:           event,
    raw:              paymentEntity as Record<string, unknown>,
  };

  if (event === "payment.captured") {
    // ── Payment successful ────────────────────────────────────────────────────
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      // Idempotency: already confirmed (client verification arrived first)
      await Payment.findByIdAndUpdate(payment._id, {
        $set:  { webhookReceived: true, webhookPayload: payload },
        $push: { attempts: attemptEntry, logs: { action: "Webhook received (already confirmed)", performedBy: "webhook", at: new Date() } },
      });
      return NextResponse.json({ received: true });
    }

    const alreadyDeducted = order.paymentStatus !== PAYMENT_STATUS.PENDING_VERIFICATION
      ? false
      : order.razorpayPaymentId != null;

    await Promise.all([
      Payment.findByIdAndUpdate(payment._id, {
        $set: {
          gatewayPaymentId: gatewayPaymentId ?? payment.gatewayPaymentId,
          transactionRef:   transactionRef ?? payment.transactionRef,
          status:           "success",
          webhookReceived:  true,
          webhookPayload:   payload,
        },
        $push: {
          attempts: attemptEntry,
          logs: { action: `payment.captured webhook — payment confirmed`, performedBy: "webhook", at: new Date() },
        },
      }),
      Order.findByIdAndUpdate(order._id, {
        $set: {
          razorpayPaymentId: gatewayPaymentId ?? order.razorpayPaymentId,
          paymentStatus:     PAYMENT_STATUS.PAID,
          status:            ORDER_STATUS.CONFIRMED,
        },
        $push: {
          timeline: {
            status:    ORDER_STATUS.CONFIRMED,
            timestamp: new Date(),
            message:   `Payment captured via Razorpay webhook. Payment ID: ${gatewayPaymentId}`,
          },
        },
      }),
    ]);

    // Decrement stock & increment coupon usage only if not already done
    if (!alreadyDeducted) {
      await Promise.all([
        ...(order.items as unknown as Array<{ productId: unknown; quantity: number }>).map((item) =>
          Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
            .catch((e: unknown) => console.error("[Stock] webhook decrement failed:", e))
        ),
        order.couponCode
          ? Coupon.updateOne(
              { code: order.couponCode },
              { $inc: { usageCount: 1 }, $push: { usedBy: order.userId } }
            ).catch((e) => console.error("[Webhook Coupon usage update failed]", e))
          : Promise.resolve(),
      ]);
    }

    // Send confirmation email
    sendConfirmationEmail(order.toObject() as unknown as Record<string, unknown>, gatewayPaymentId ?? "").catch((e) =>
      console.error("[Email] webhook confirm email failed:", e)
    );

  } else if (event === "payment.failed") {
    // ── Payment failed ────────────────────────────────────────────────────────
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      // Already paid (race condition — ignore failure webhook)
      return NextResponse.json({ received: true });
    }

    await Promise.all([
      Payment.findByIdAndUpdate(payment._id, {
        $set: {
          gatewayPaymentId: gatewayPaymentId ?? payment.gatewayPaymentId,
          status:           "failed",
          webhookReceived:  true,
          webhookPayload:   payload,
        },
        $push: {
          attempts: attemptEntry,
          logs: { action: "payment.failed webhook received", performedBy: "webhook", at: new Date() },
        },
      }),
      Order.findByIdAndUpdate(order._id, {
        $set: { paymentStatus: PAYMENT_STATUS.FAILED },
        $push: {
          timeline: {
            status:    ORDER_STATUS.PENDING,
            timestamp: new Date(),
            message:   `Payment failed via Razorpay. Payment ID: ${gatewayPaymentId ?? "N/A"}`,
          },
        },
      }),
    ]);

    // Notify customer payment failed
    sendFailedEmail(order.toObject() as unknown as Record<string, unknown>).catch((e) => console.error("[Email] payment failed email:", e));
  }

  return NextResponse.json({ received: true });
}

// ── Email helpers ───────────────────────────────────────────────────────────

async function getCustomerEmail(userId: unknown): Promise<string> {
  try {
    const user = await User.findById(userId).select("email name").lean();
    return (user as { email: string } | null)?.email ?? "";
  } catch { return ""; }
}

async function sendConfirmationEmail(order: Record<string, unknown>, paymentId: string) {
  const toEmail = await getCustomerEmail(order.userId);

  const addr = order.shippingAddress as Record<string, string>;
  const items = (order.items as Array<Record<string, unknown>>).map((i) => ({
    name:     String(i.name ?? ""),
    image:    String(i.image ?? ""),
    quantity: Number(i.quantity ?? 1),
    price:    Number(i.price ?? 0),
  }));

  const eta = order.estimatedDelivery
    ? new Date(order.estimatedDelivery as Date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "4–7 business days";

  // Send confirmation email to Customer
  if (toEmail) {
    sendEmail({
      to:      toEmail,
      subject: `Order Confirmed – ${order.orderNumber} | SunEra Lifestyle`,
      html:    orderConfirmationTemplate({
        name:              addr.name ?? "Valued Customer",
        orderNumber:       order.orderNumber as string,
        orderDate:         new Date(order.createdAt as Date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
        estimatedDelivery: eta,
        items,
        subtotal:          order.subtotal as number,
        shippingFee:       order.shippingFee as number,
        couponDiscount:    order.couponDiscount as number,
        couponCode:        order.couponCode as string | undefined,
        total:             order.total as number,
        shippingAddress:   { name: addr.name ?? "", addressLine1: addr.addressLine1 ?? "", city: addr.city ?? "", state: addr.state ?? "", pincode: addr.pincode ?? "" },
        paymentMethod:     order.paymentMethod as string,
        trackUrl:          `${BASE_URL}/account/orders`,
      }),
    }).catch((e) => console.error("[Webhook Email] customer email failed:", e));
  }

  // Send new order notification email to Admin
  try {
    const adminUsers = await User.find({ role: "admin", isActive: true }).select("email").lean();
    const adminEmails = adminUsers.map((u) => u.email).filter(Boolean);
    const fallbackAdmin = process.env.ADMIN_EMAIL ?? "admin@sunera.in";
    const targetAdmins = Array.from(new Set([...adminEmails, fallbackAdmin]));

    for (const adminEmail of targetAdmins) {
      sendEmail({
        to:      adminEmail,
        subject: `🚨 New Order Received – #${order.orderNumber} | SunEra Admin`,
        html:    orderConfirmationTemplate({
          name:              addr.name ?? "Valued Customer",
          orderNumber:       order.orderNumber as string,
          orderDate:         new Date(order.createdAt as Date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
          estimatedDelivery: eta,
          items,
          subtotal:          order.subtotal as number,
          shippingFee:       order.shippingFee as number,
          couponDiscount:    order.couponDiscount as number,
          couponCode:        order.couponCode as string | undefined,
          total:             order.total as number,
          shippingAddress:   { name: addr.name ?? "", addressLine1: addr.addressLine1 ?? "", city: addr.city ?? "", state: addr.state ?? "", pincode: addr.pincode ?? "" },
          paymentMethod:     order.paymentMethod as string,
          trackUrl:          `${BASE_URL}/admin/orders`,
        }),
      }).catch((e) => console.error("[Webhook Email] admin email failed:", e));
    }
  } catch (e) {
    console.error("[Webhook Email] admin lookup failed:", e);
  }

  void paymentId;
}

async function sendFailedEmail(order: Record<string, unknown>) {
  const toEmail = await getCustomerEmail(order.userId);
  if (!toEmail) return;
  await sendEmail({
    to:      toEmail,
    subject: `Payment Failed – Order ${order.orderNumber} | SunEra Lifestyle`,
    html:    orderStatusTemplate({
      name:        (order.shippingAddress as Record<string, string>).name ?? "Valued Customer",
      orderNumber: order.orderNumber as string,
      status:      "cancelled",
      message:     `Your payment for order ${order.orderNumber} could not be processed. No amount has been charged. You may place a new order at any time.`,
      trackUrl:    `${BASE_URL}/account/orders`,
    }),
  });
}
