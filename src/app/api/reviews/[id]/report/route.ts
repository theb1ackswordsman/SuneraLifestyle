import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Review, REVIEW_STATUS, REPORT_REASONS } from "@/models/review.model";
import { getServerSession } from "@/lib/auth/session";
import { ok, unauthorized, notFound, badRequest, conflict, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.user) return unauthorized();

    const { id } = await params;
    await connectDB();

    const review = await Review.findOne({ _id: id, status: REVIEW_STATUS.APPROVED, deletedAt: null });
    if (!review) return notFound("Review not found.");

    const { reason } = await req.json() as { reason?: string };
    if (!reason || !(REPORT_REASONS as readonly string[]).includes(reason)) {
      return badRequest("Invalid report reason.");
    }

    const userId = session.user._id;
    const alreadyReported = review.reports.some((r) => r.userId.toString() === userId.toString());
    if (alreadyReported) return conflict("You have already reported this review.");

    review.reports.push({ userId: userId as unknown as import("mongoose").Types.ObjectId, reason, createdAt: new Date() });
    review.reportCount += 1;
    await review.save();

    return ok("Review reported. Thank you for helping keep the community safe.");
  } catch (err) {
    return handleApiError(err);
  }
}
