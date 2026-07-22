import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Return, RETURN_STATUS, RETURN_REASONS } from "@/models/return.model";
import { Order } from "@/models/order.model";
import { getServerSession } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/mailer";
import { returnSubmittedTemplate } from "@/lib/email/templates";
import {
  ok, created, unauthorized, badRequest, notFound, conflict, handleApiError,
} from "@/lib/api/response";

export const dynamic = "force-dynamic";

const RETURN_WINDOW_DAYS = 7;

function generateReturnNumber(): string {
  return "RET" + Date.now().toString().slice(-7) + Math.floor(100 + Math.random() * 900);
}

// GET /api/returns — customer's own returns
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.user) return unauthorized();

  await connectDB();

  const orderId = new URL(req.url).searchParams.get("orderId");
  const query: Record<string, unknown> = { userId: session.user._id, deletedAt: null };
  if (orderId) query.orderId = orderId;

  const returns = await Return.find(query).sort({ createdAt: -1 }).lean();
  return ok(returns);
}

// POST /api/returns — create return request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.user) return unauthorized();

    await connectDB();

    const body = await req.json();
    const { orderId, reason, description, images, video } = body;

    if (!orderId) return badRequest("Order ID is required.");
    if (!reason || !RETURN_REASONS.includes(reason)) return badRequest("Invalid return reason.");

    // Verify order belongs to this user and is delivered
    const order = await Order.findOne({ _id: orderId, userId: session.user._id }).lean();
    if (!order) return notFound("Order not found.");
    if (order.status !== "delivered") {
      return badRequest("Returns can only be requested for delivered orders.");
    }

    // Find delivery timestamp from timeline
    const deliveredEntry = [...(order.timeline ?? [])]
      .reverse()
      .find((t) => t.status === "delivered");
    const deliveredAt  = deliveredEntry ? new Date(deliveredEntry.timestamp) : new Date((order as Record<string, unknown>).updatedAt as Date);
    const windowExpiry = new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * 86_400_000);

    if (Date.now() > windowExpiry.getTime()) {
      return badRequest(`Return window expired. Returns must be requested within ${RETURN_WINDOW_DAYS} days of delivery.`);
    }

    // Prevent duplicate active return for this order
    const existing = await Return.findOne({
      orderId,
      status: { $nin: [RETURN_STATUS.REJECTED] },
      deletedAt: null,
    });
    if (existing) return conflict("A return request already exists for this order.");

    const items = (order.items as unknown as Array<Record<string, unknown>>).map((i) => ({
      _id:      String(i._id ?? ""),
      name:     String(i.name ?? "Unknown"),
      image:    String(i.image ?? ""),
      price:    Number(i.price ?? 0),
      quantity: Number(i.quantity ?? 1),
    }));

    const returnDoc = await Return.create({
      returnNumber:       generateReturnNumber(),
      orderId,
      orderNumber:        order.orderNumber,
      userId:             session.user._id,
      items,
      orderTotal:         order.total,
      reason,
      description:        description?.trim() || undefined,
      images:             Array.isArray(images) ? images.filter(Boolean).slice(0, 5) : [],
      video:              video?.trim() || undefined,
      status:             RETURN_STATUS.REQUESTED,
      timeline: [{
        status:      RETURN_STATUS.REQUESTED,
        message:     "Return request submitted by customer.",
        timestamp:   new Date(),
        performedBy: "customer",
      }],
      returnWindowExpiry: windowExpiry,
      refund:             {},
    });

    // Non-blocking confirmation email
    sendEmail({
      to:      session.user.email,
      subject: `Return Request Received – ${returnDoc.returnNumber} | SunEra Lifestyle`,
      html:    returnSubmittedTemplate({
        returnNumber: returnDoc.returnNumber,
        orderNumber:  order.orderNumber,
        items:        items.map((i) => ({ name: i.name, quantity: i.quantity })),
        reason:       reason.replace(/_/g, " "),
      }),
    }).catch((e) => console.error("[Return email] submitted:", e));

    return created(returnDoc);
  } catch (err) {
    return handleApiError(err);
  }
}
