import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Return, RETURN_STATUS } from "@/models/return.model";
import { getServerSession } from "@/lib/auth/session";
import { ok, unauthorized, notFound, badRequest, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.user) return unauthorized();

    const { id } = await params;
    await connectDB();

    const returnDoc = await Return.findOne({
      _id:       id,
      userId:    session.user._id,
      deletedAt: null,
    }).lean();

    if (!returnDoc) return notFound("Return request not found.");
    return ok(returnDoc);
  } catch (err) {
    return handleApiError(err);
  }
}

// PATCH /api/returns/[id] — Customer cancels their return request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.user) return unauthorized();

    const { id } = await params;
    await connectDB();

    const returnDoc = await Return.findOne({
      _id:       id,
      userId:    session.user._id,
      deletedAt: null,
    });

    if (!returnDoc) return notFound("Return request not found.");

    if (
      returnDoc.status !== RETURN_STATUS.REQUESTED &&
      returnDoc.status !== RETURN_STATUS.UNDER_REVIEW
    ) {
      return badRequest("Only pending or under-review return requests can be cancelled.");
    }

    returnDoc.status = RETURN_STATUS.CANCELLED;
    returnDoc.timeline.push({
      status:      RETURN_STATUS.CANCELLED,
      message:     "Return request cancelled by customer.",
      timestamp:   new Date(),
      performedBy: "customer",
    });

    await returnDoc.save();
    return ok(returnDoc, "Return request cancelled.");
  } catch (err) {
    return handleApiError(err);
  }
}
