import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Return } from "@/models/return.model";
import { getServerSession } from "@/lib/auth/session";
import { ok, unauthorized, notFound, handleApiError } from "@/lib/api/response";

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
      _id:      id,
      userId:   session.user._id,
      deletedAt: null,
    }).lean();

    if (!returnDoc) return notFound("Return request not found.");
    return ok(returnDoc);
  } catch (err) {
    return handleApiError(err);
  }
}
