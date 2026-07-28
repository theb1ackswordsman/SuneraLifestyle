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
    const body = await req.json() as {
      status?: string;
      paymentStatus?: string;
      itemId?: string;
      itemStatus?: string;
    };

    const order = await Order.findById(id);
    if (!order) return notFound("Order not found.");

    // Payment-status-only update (Mark as Paid / manual override)
    if (body.paymentStatus && !body.status && !body.itemId) {
      const VALID = ["paid", "pending", "failed", "refunded", "partially_refunded"];
      if (!VALID.includes(body.paymentStatus)) return badRequest("Invalid payment status.");
      order.paymentStatus = body.paymentStatus as never;
      await order.save();
      return ok({ order }, "Payment status updated.");
    }

    // ── Individual Item Status Update ──────────────────────────────────────────
    if (body.itemId && body.itemStatus) {
      if (!Object.values(ORDER_STATUS).includes(body.itemStatus as never)) {
        return badRequest("Invalid item status.");
      }
      const itemsList = order.items as unknown as Array<Record<string, unknown>>;
      const item = itemsList.find(
        (i) => String(i._id) === String(body.itemId)
      );
      if (!item) return notFound("Order item not found.");

      item.status = body.itemStatus;

      order.timeline.push({
        status: body.itemStatus as never,
        timestamp: new Date(),
        message: `Item "${item.name}" status updated to ${body.itemStatus} by admin.`,
      });

      // Recalculate overall order status based on all item statuses
      const itemStatuses = itemsList.map(
        (i) => (i.status as string) || order.status
      );

      if (itemStatuses.every((s) => s === "delivered")) {
        order.status = "delivered" as never;
      } else if (itemStatuses.every((s) => s === "cancelled")) {
        order.status = "cancelled" as never;
      } else if (itemStatuses.some((s) => s === "delivered" || s === "shipped")) {
        order.status = "shipped" as never;
      } else if (itemStatuses.some((s) => s === "packed")) {
        order.status = "packed" as never;
      } else if (itemStatuses.some((s) => s === "confirmed")) {
        order.status = "confirmed" as never;
      }

      await order.save();
      return ok({ order }, `Updated item "${item.name}" to ${body.itemStatus}.`);
    }

    // ── Overall Order Status Update ────────────────────────────────────────────
    const { status } = body;
    if (!status || !Object.values(ORDER_STATUS).includes(status as never)) {
      return badRequest("Invalid order status.");
    }

    const isCancelling = status === "cancelled";
    order.status = status as never;
    if (isCancelling) {
      order.cancelledBy = {
        role: "admin",
        name: "Sunera Lifestyle",
        at: new Date(),
      };
    }

    // Also update all items to mirror the overall order status
    (order.items as unknown as Array<Record<string, unknown>>).forEach((i) => {
      i.status = status;
    });

    order.timeline.push({
      status: status as never,
      timestamp: new Date(),
      message: isCancelling ? "Cancelled by Sunera Lifestyle" : `Status updated to ${status} by admin.`,
    });

    await order.save();

    // Send status email (non-blocking)
    const msg = STATUS_MESSAGES[status];
    if (msg) {
      (async () => {
        try {
          const user = await User.findById(order.userId).select("name email").lean();
          if (!user?.email) return;
          const eta = order.estimatedDelivery
            ? new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
            : undefined;
          await sendEmail({
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
        } catch (e) {
          console.error("[Status email] failed for order", order.orderNumber, e);
        }
      })();
    }

    return ok({ order }, "Order status updated.");
  } catch (err) {
    return handleApiError(err);
  }
}
