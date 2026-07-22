import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Order } from "@/models/order.model";
import { User } from "@/models/user.model";
import { ok, forbidden, notFound, badRequest, handleApiError } from "@/lib/api/response";
import { ORDER_STATUS } from "@/constants";
import { sendEmail } from "@/lib/email/mailer";
import { orderStatusTemplate } from "@/lib/email/templates";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const STATUS_MESSAGES: Record<string, string> = {
  confirmed: "your order has been confirmed and is being prepared.",
  packed:    "your order has been packed and is ready to dispatch.",
  shipped:   "your order is on its way to you!",
  delivered: "your order has been delivered. We hope you love it!",
  cancelled: "your order has been cancelled. If you have any questions, please contact us.",
  refunded:  "your refund has been processed.",
};

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();
    const { id } = await params;
    const order = await Order.findById(id)
      .populate("userId", "name email phone")
      .lean();
    if (!order) return notFound("Order not found.");
    return ok({ order });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();
    const { id } = await params;
    const { status } = await req.json() as { status: string };

    if (!Object.values(ORDER_STATUS).includes(status as never)) {
      return badRequest("Invalid order status.");
    }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        $set: { status },
        $push: { timeline: { status, timestamp: new Date(), message: `Status updated to ${status} by admin.` } },
      },
      { new: true }
    );

    if (!order) return notFound("Order not found.");

    // Send status email (non-blocking)
    const msg = STATUS_MESSAGES[status];
    if (msg) {
      User.findById(order.userId).select("name email").lean()
        .then((user) => {
          if (!user?.email) return;
          const eta = order.estimatedDelivery
            ? new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
            : undefined;
          return sendEmail({
            to:      user.email,
            subject: `Order ${status.charAt(0).toUpperCase() + status.slice(1)} – ${order.orderNumber} | SunEra Lifestyle`,
            html:    orderStatusTemplate({
              name:              user.name ?? "Valued Customer",
              orderNumber:       order.orderNumber,
              status,
              message:           msg,
              estimatedDelivery: eta,
              trackingNumber:    order.trackingNumber,
              trackUrl:          `${BASE_URL}/account/orders`,
            }),
          });
        })
        .catch((e) => console.error("[Status email] failed:", e));
    }

    return ok({ order }, "Order status updated.");
  } catch (err) {
    return handleApiError(err);
  }
}
