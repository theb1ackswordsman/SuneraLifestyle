import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Return, RETURN_STATUS, REFUND_STATUS } from "@/models/return.model";
import { Order } from "@/models/order.model";
import { User } from "@/models/user.model";
import { sendEmail } from "@/lib/email/mailer";
import {
  returnApprovedTemplate, returnRejectedTemplate,
  refundProcessingTemplate, refundCompletedTemplate, refundFailedTemplate,
} from "@/lib/email/templates";
import { ok, forbidden, notFound, badRequest, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

async function getUserEmail(userId: unknown): Promise<string | null> {
  const user = await User.findById(userId).select("email name").lean();
  return user?.email ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(req)) return forbidden();
    const { id } = await params;
    await connectDB();

    const returnDoc = await Return.findOne({ _id: id, deletedAt: null })
      .populate("userId", "name email phone")
      .lean();

    if (!returnDoc) return notFound("Return request not found.");
    return ok(returnDoc);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(req)) return forbidden();
    const { id } = await params;
    await connectDB();

    const returnDoc = await Return.findOne({ _id: id, deletedAt: null });
    if (!returnDoc) return notFound("Return request not found.");

    const body = await req.json() as {
      action:         string;
      adminNote?:     string;
      refundAmount?:  number;
      refundNotes?:   string;
      failureReason?: string;
    };
    const { action } = body;

    // ── under_review ──────────────────────────────────────────────────────────
    if (action === "under_review") {
      returnDoc.status = RETURN_STATUS.UNDER_REVIEW;
      returnDoc.timeline.push({ status: RETURN_STATUS.UNDER_REVIEW, message: "Return request is being reviewed by admin.", timestamp: new Date(), performedBy: "admin" });
      await returnDoc.save();
      return ok(returnDoc, "Status updated to Under Review.");
    }

    // ── approve ───────────────────────────────────────────────────────────────
    if (action === "approve") {
      returnDoc.status    = RETURN_STATUS.APPROVED;
      returnDoc.adminNote = body.adminNote;
      returnDoc.timeline.push({ status: RETURN_STATUS.APPROVED, message: body.adminNote || "Return request approved by admin.", timestamp: new Date(), performedBy: "admin" });
      await returnDoc.save();

      const email = await getUserEmail(returnDoc.userId);
      if (email) {
        sendEmail({
          to:      email,
          subject: `Return Approved – ${returnDoc.returnNumber} | SunEra Lifestyle`,
          html:    returnApprovedTemplate({
            returnNumber: returnDoc.returnNumber,
            orderNumber:  returnDoc.orderNumber,
            items:        returnDoc.items.map((i) => ({ name: i.name, quantity: i.quantity })),
            adminNote:    body.adminNote,
            trackUrl:     `${BASE_URL}/account/returns/${String(returnDoc._id)}`,
          }),
        }).catch((e) => console.error("[Return email] approved:", e));
      }
      return ok(returnDoc, "Return approved.");
    }

    // ── reject ────────────────────────────────────────────────────────────────
    if (action === "reject") {
      if (!body.adminNote?.trim()) return badRequest("Rejection reason is required.");
      returnDoc.status    = RETURN_STATUS.REJECTED;
      returnDoc.adminNote = body.adminNote.trim();
      returnDoc.timeline.push({ status: RETURN_STATUS.REJECTED, message: body.adminNote.trim(), timestamp: new Date(), performedBy: "admin" });
      await returnDoc.save();

      const email = await getUserEmail(returnDoc.userId);
      if (email) {
        sendEmail({
          to:      email,
          subject: `Return Request Rejected – ${returnDoc.returnNumber} | SunEra Lifestyle`,
          html:    returnRejectedTemplate({
            returnNumber:    returnDoc.returnNumber,
            orderNumber:     returnDoc.orderNumber,
            items:           returnDoc.items.map((i) => ({ name: i.name, quantity: i.quantity })),
            rejectionReason: body.adminNote.trim(),
            trackUrl:        `${BASE_URL}/account/returns/${String(returnDoc._id)}`,
          }),
        }).catch((e) => console.error("[Return email] rejected:", e));
      }
      return ok(returnDoc, "Return rejected.");
    }

    // ── process_refund (Razorpay) ─────────────────────────────────────────────
    if (action === "process_refund") {
      if (returnDoc.status !== RETURN_STATUS.APPROVED) {
        return badRequest("Refund can only be processed for approved returns.");
      }
      if (returnDoc.refund?.status === REFUND_STATUS.COMPLETED) {
        return badRequest("Refund already completed.");
      }

      const order = await Order.findById(returnDoc.orderId).select("razorpayPaymentId paymentMethod total").lean();
      if (!order) return notFound("Associated order not found.");

      const refundAmount = Math.round((body.refundAmount ?? returnDoc.orderTotal) * 100); // paise

      // Try Razorpay if payment was online
      if (order.paymentMethod === "razorpay" && (order as Record<string, unknown>).razorpayPaymentId) {
        try {
          const RazorpayLib = (await import("razorpay")).default;
          const rzp = new RazorpayLib({
            key_id:     process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
          });
          const rzpRefund = await rzp.payments.refund(
            (order as Record<string, unknown>).razorpayPaymentId as string,
            {
              amount: refundAmount,
              speed:  "normal",
              notes:  { returnId: String(returnDoc._id), returnNumber: returnDoc.returnNumber },
            }
          );

          returnDoc.status            = RETURN_STATUS.REFUND_PROCESSING;
          returnDoc.refund.amount     = refundAmount / 100;
          returnDoc.refund.status     = REFUND_STATUS.PROCESSING;
          returnDoc.refund.method     = "razorpay";
          returnDoc.refund.gatewayRefundId = (rzpRefund as Record<string, unknown>).id as string;
          returnDoc.refund.initiatedAt     = new Date();
          returnDoc.refund.notes           = body.refundNotes;
          returnDoc.timeline.push({
            status:      RETURN_STATUS.REFUND_PROCESSING,
            message:     `Refund of ₹${refundAmount / 100} initiated via Razorpay. ID: ${(rzpRefund as Record<string, unknown>).id}`,
            timestamp:   new Date(),
            performedBy: "admin",
          });
          await returnDoc.save();

          const email = await getUserEmail(returnDoc.userId);
          if (email) {
            sendEmail({
              to:      email,
              subject: `Refund Processing – ${returnDoc.returnNumber} | SunEra Lifestyle`,
              html:    refundProcessingTemplate({
                returnNumber:  returnDoc.returnNumber,
                orderNumber:   returnDoc.orderNumber,
                refundAmount:  refundAmount / 100,
                paymentMethod: "Razorpay",
                trackUrl:      `${BASE_URL}/account/returns/${String(returnDoc._id)}`,
              }),
            }).catch((e) => console.error("[Return email] refund processing:", e));
          }
          return ok(returnDoc, "Refund initiated via Razorpay.");
        } catch (rzpErr) {
          const reason = rzpErr instanceof Error ? rzpErr.message : String(rzpErr);
          returnDoc.refund.status        = REFUND_STATUS.FAILED;
          returnDoc.refund.failureReason = reason;
          returnDoc.timeline.push({ status: "refund_failed", message: `Refund failed: ${reason}`, timestamp: new Date(), performedBy: "system" });
          await returnDoc.save();
          return badRequest("Razorpay refund failed: " + reason);
        }
      }

      // Manual / COD refund
      returnDoc.status            = RETURN_STATUS.REFUND_PROCESSING;
      returnDoc.refund.amount     = refundAmount / 100;
      returnDoc.refund.status     = REFUND_STATUS.PROCESSING;
      returnDoc.refund.method     = "manual";
      returnDoc.refund.initiatedAt = new Date();
      returnDoc.refund.notes       = body.refundNotes;
      returnDoc.timeline.push({ status: RETURN_STATUS.REFUND_PROCESSING, message: "Refund marked as processing by admin.", timestamp: new Date(), performedBy: "admin" });
      await returnDoc.save();
      return ok(returnDoc, "Refund marked as processing.");
    }

    // ── complete_refund ───────────────────────────────────────────────────────
    if (action === "complete_refund") {
      returnDoc.status               = RETURN_STATUS.REFUND_COMPLETED;
      returnDoc.refund.status        = REFUND_STATUS.COMPLETED;
      returnDoc.refund.completedAt   = new Date();
      returnDoc.refund.gatewayRefundId = body.adminNote || returnDoc.refund.gatewayRefundId;
      returnDoc.timeline.push({ status: RETURN_STATUS.REFUND_COMPLETED, message: "Refund completed.", timestamp: new Date(), performedBy: "admin" });
      await returnDoc.save();

      const email = await getUserEmail(returnDoc.userId);
      if (email) {
        sendEmail({
          to:      email,
          subject: `Refund Completed – ${returnDoc.returnNumber} | SunEra Lifestyle`,
          html:    refundCompletedTemplate({
            returnNumber:    returnDoc.returnNumber,
            orderNumber:     returnDoc.orderNumber,
            refundAmount:    returnDoc.refund.amount ?? 0,
            refundId:        returnDoc.refund.gatewayRefundId ?? "N/A",
            paymentMethod:   returnDoc.refund.method ?? "Bank Transfer",
            refundDate:      new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
            trackUrl:        `${BASE_URL}/account/returns/${String(returnDoc._id)}`,
          }),
        }).catch((e) => console.error("[Return email] refund completed:", e));
      }
      return ok(returnDoc, "Refund marked as completed.");
    }

    // ── fail_refund ───────────────────────────────────────────────────────────
    if (action === "fail_refund") {
      returnDoc.refund.status        = REFUND_STATUS.FAILED;
      returnDoc.refund.failureReason = body.failureReason || "Refund failed.";
      returnDoc.timeline.push({ status: "refund_failed", message: body.failureReason || "Refund failed.", timestamp: new Date(), performedBy: "admin" });
      await returnDoc.save();

      const email = await getUserEmail(returnDoc.userId);
      if (email) {
        sendEmail({
          to:      email,
          subject: `Refund Failed – ${returnDoc.returnNumber} | SunEra Lifestyle`,
          html:    refundFailedTemplate({
            returnNumber:   returnDoc.returnNumber,
            orderNumber:    returnDoc.orderNumber,
            failureReason:  body.failureReason || "Refund processing failed.",
          }),
        }).catch((e) => console.error("[Return email] refund failed:", e));
      }
      return ok(returnDoc, "Refund marked as failed.");
    }

    return badRequest("Invalid action.");
  } catch (err) {
    return handleApiError(err);
  }
}
