import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Review, REVIEW_STATUS } from "@/models/review.model";
import { getServerSession } from "@/lib/auth/session";
import { ok, unauthorized, notFound, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.user) return unauthorized();

    const { id } = await params;
    await connectDB();

    const review = await Review.findOne({ _id: id, status: REVIEW_STATUS.APPROVED, deletedAt: null });
    if (!review) return notFound("Review not found.");

    const userId       = session.user._id;
    const alreadyVoted = review.helpfulBy.some((uid) => uid.toString() === userId.toString());
    let helpful: boolean;

    let updated;
    if (alreadyVoted) {
      updated = await Review.findByIdAndUpdate(
        id,
        { $pull: { helpfulBy: userId }, $inc: { helpfulCount: -1 } },
        { new: true }
      ).lean();
      helpful = false;
    } else {
      updated = await Review.findByIdAndUpdate(
        id,
        { $addToSet: { helpfulBy: userId }, $inc: { helpfulCount: 1 } },
        { new: true }
      ).lean();
      helpful = true;
    }

    return ok({ helpful, helpfulCount: updated?.helpfulCount ?? review.helpfulCount });
  } catch (err) {
    return handleApiError(err);
  }
}
