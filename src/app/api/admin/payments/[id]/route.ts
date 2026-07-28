import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Payment } from "@/models/payment.model";
import { Order } from "@/models/order.model";
import { Product } from "@/models/product.model";
import { User } from "@/models/user.model";
import { ok, forbidden, notFound, badRequest, handleApiError } from "@/lib/api/response";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/constants";
import { sendEmail } from "@/lib/email/mailer";
import { orderConfirmationTemplate, orderStatusTemplate } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

// GET /api/admin/payments/[id] — full payment detail with logs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return forbidden();
  const { id } = await params;
  await connectDB();

  const payment = await Payment.findById(id)
    .populate("userId", "name email")
    .populate("adminVerifiedById", "name email")
    .lean();

  if (!payment) return notFound("Payment record not found.");

  const order = await Order.findById(payment.orderId)
    .select("orderNumber status paymentStatus timeline items total")
    .lean();

  return ok({ payment, order });
}

// PUT /api/admin/payments/[id] — manual status update (verify/reject)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(req)) return forbidden();
    const { id } = await params;
    const body = await req.json();
    const { action, note } = body as { action: "mark_success" | "mark_failed"; note?: string };

    if (!action) return badRequest("Action is required.");
    if (!["mark_success", "mark_failed"].includes(action))
      return badRequest("Invalid action. Must be mark_success or mark_failed.");

    await connectDB();

    const payment = await Payment.findById(id);
    if (!payment) return notFound("Payment record not found.");

    // Only allow changes on pending_verification payments
    if (payment.status !== "pending_verification") {
      return badRequest(`Cannot change status of a payment that is already "${payment.status}".`);
    }

    const adminId = req.headers.get("x-user-id");
    const now = new Date();

    if (action === "mark_success") {
      const order = await Order.findById(payment.orderId);
      if (!order) return notFound("Associated order not found.");

      // Guard: don't double-decrement stock
      const wasAlreadyConfirmed = order.paymentStatus === PAYMENT_STATUS.PAID;

      await Promise.all([
        Payment.findByIdAndUpdate(id, {
          $set: {
            status:            "success",
            adminVerifiedById: adminId ?? undefined,
            adminVerifiedAt:   now,
            adminNote:         note ?? "",
          },
          $push: {
            logs: {
              action:      `Admin manually marked payment as SUCCESS`,
              performedBy: "admin",
              performedById: adminId ?? undefined,
              note:        note ?? "",
              at:          now,
            },
          },
        }),
        Order.findByIdAndUpdate(order._id, {
          $set: {
            paymentStatus: PAYMENT_STATUS.PAID,
            status:        ORDER_STATUS.CONFIRMED,
          },
          $push: {
            timeline: {
              status:    ORDER_STATUS.CONFIRMED,
              timestamp: now,
              message:   `Payment manually verified and confirmed by admin. Note: ${note ?? "N/A"}`,
            },
          },
        }),
      ]);

      // Decrement stock only if order wasn't already confirmed
      if (!wasAlreadyConfirmed) {
        await Promise.all(
          (order.items as unknown as Array<{ productId: unknown; quantity: number }>).map((item) =>
            Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
              .catch((e: unknown) => console.error("[Stock] admin verify decrement failed:", e))
          )
        );
      }

      // Notify customer
      notifyCustomerSuccess(order.toObject() as unknown as Record<string, unknown>).catch((e) => console.error("[Email] admin verify email:", e));

      return ok({ status: "success" }, "Payment marked as successful. Order confirmed.");
    }

    if (action === "mark_failed") {
      await Promise.all([
        Payment.findByIdAndUpdate(id, {
          $set: {
            status:            "failed",
            adminVerifiedById: adminId ?? undefined,
            adminVerifiedAt:   now,
            adminNote:         note ?? "",
          },
          $push: {
            logs: {
              action:      "Admin manually marked payment as FAILED",
              performedBy: "admin",
              performedById: adminId ?? undefined,
              note:        note ?? "",
              at:          now,
            },
          },
        }),
        Order.findByIdAndUpdate(payment.orderId, {
          $set: { paymentStatus: PAYMENT_STATUS.FAILED },
          $push: {
            timeline: {
              status:    ORDER_STATUS.PENDING,
              timestamp: now,
              message:   `Payment manually marked as failed by admin. Note: ${note ?? "N/A"}`,
            },
          },
        }),
      ]);

      notifyCustomerFailed(payment.orderNumber).catch((e) => console.error("[Email] admin fail email:", e));

      return ok({ status: "failed" }, "Payment marked as failed.");
    }

    return badRequest("Unknown action.");
  } catch (err) {
    return handleApiError(err);
  }
}

// PATCH /api/admin/payments/[id] — add or delete private admin notes
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(req)) return forbidden();
    const { id } = await params;
    const body = await req.json();
    const { note, adminNote, deleteNoteId } = body as {
      note?: string;
      adminNote?: string;
      deleteNoteId?: string;
    };

    await connectDB();

    const adminId = req.headers.get("x-user-id");
    const now = new Date();

    // If deleting a specific note
    if (deleteNoteId) {
      const payment = await Payment.findByIdAndUpdate(
        id,
        {
          $pull: { adminNotes: { _id: deleteNoteId } },
          $push: {
            logs: {
              action:      "Deleted private admin note",
              performedBy: "admin",
              performedById: adminId ?? undefined,
              at:          now,
            },
          },
        },
        { new: true }
      );
      if (!payment) return notFound("Payment record not found.");
      return ok({ adminNotes: payment.adminNotes, adminNote: payment.adminNote }, "Note deleted.");
    }

    const noteToSave = (adminNote !== undefined ? adminNote : (note ?? "")).trim();
    if (!noteToSave) return badRequest("Note content cannot be empty.");

    const newNoteObj = {
      note: noteToSave,
      createdAt: now,
      createdBy: "Admin",
    };

    const payment = await Payment.findByIdAndUpdate(
      id,
      {
        $set: { adminNote: noteToSave },
        $push: {
          adminNotes: newNoteObj,
          logs: {
            action:      "Added private admin note",
            performedBy: "admin",
            performedById: adminId ?? undefined,
            note:        noteToSave,
            at:          now,
          },
        },
      },
      { new: true }
    );

    if (!payment) return notFound("Payment record not found.");

    return ok(
      { adminNotes: payment.adminNotes, adminNote: payment.adminNote },
      "Private admin note added successfully."
    );
  } catch (err) {
    return handleApiError(err);
  }
}

// ── Email helpers ───────────────────────────────────────────────────────────

async function getEmail(userId: unknown): Promise<{ email: string; name: string }> {
  try {
    const u = await User.findById(userId).select("email name").lean() as { email: string; name: string } | null;
    return u ?? { email: "", name: "Valued Customer" };
  } catch { return { email: "", name: "Valued Customer" }; }
}

async function notifyCustomerSuccess(order: Record<string, unknown>) {
  const { email, name } = await getEmail(order.userId);
  if (!email) return;

  const addr = order.shippingAddress as Record<string, string>;
  const eta = order.estimatedDelivery
    ? new Date(order.estimatedDelivery as Date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "4–7 business days";

  await sendEmail({
    to:      email,
    subject: `Order Confirmed – ${order.orderNumber} | SunEra Lifestyle`,
    html:    orderConfirmationTemplate({
      name:              addr.name ?? name,
      orderNumber:       order.orderNumber as string,
      orderDate:         new Date(order.createdAt as Date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      estimatedDelivery: eta,
      items:             (order.items as Array<Record<string, unknown>>).map((i) => ({
        name:     String(i.name ?? ""),
        image:    String(i.image ?? ""),
        quantity: Number(i.quantity ?? 1),
        price:    Number(i.price ?? 0),
      })),
      subtotal:          order.subtotal as number,
      shippingFee:       order.shippingFee as number,
      couponDiscount:    order.couponDiscount as number,
      couponCode:        order.couponCode as string | undefined,
      total:             order.total as number,
      shippingAddress:   { name: addr.name ?? "", addressLine1: addr.addressLine1 ?? "", city: addr.city ?? "", state: addr.state ?? "", pincode: addr.pincode ?? "" },
      paymentMethod:     order.paymentMethod as string,
      trackUrl:          `${BASE_URL}/account/orders`,
    }),
  });
}

async function notifyCustomerFailed(orderNumber: string) {
  // Find order and user for email
  const order = await Order.findOne({ orderNumber }).populate("userId", "email name").lean() as (Record<string, unknown> & { userId: { email: string; name: string } }) | null;
  if (!order || !order.userId?.email) return;

  await sendEmail({
    to:      order.userId.email,
    subject: `Payment Update – Order ${orderNumber} | SunEra Lifestyle`,
    html:    orderStatusTemplate({
      name:        order.userId.name ?? "Valued Customer",
      orderNumber,
      status:      "cancelled",
      message:     `After reviewing your payment for order ${orderNumber}, our team was unable to confirm the transaction. If any amount was deducted from your account, it will be automatically refunded by your bank within 5–7 business days. Please feel free to contact us for assistance.`,
      trackUrl:    `${BASE_URL}/account/orders`,
    }),
  });
}
