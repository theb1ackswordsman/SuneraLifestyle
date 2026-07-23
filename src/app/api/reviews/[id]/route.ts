import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Review, REVIEW_STATUS } from "@/models/review.model";
import { recalculateProductRating } from "@/lib/shop/recalculate-rating";
import { getServerSession } from "@/lib/auth/session";
import {
  ok, unauthorized, badRequest, notFound, forbidden, handleApiError,
} from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const review = await Review.findOne({ _id: id, deletedAt: null })
      .populate("customerId", "name")
      .lean();

    if (!review) return notFound("Review not found.");
    if (review.status === REVIEW_STATUS.APPROVED) return ok(review);

    const session = await getServerSession();
    if (!session.isAuthenticated || !session.user) return unauthorized();
    if (review.customerId?.toString() !== session.user._id.toString()) return forbidden();

    return ok(review);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.user) return unauthorized();

    const { id } = await params;
    await connectDB();

    const review = await Review.findOne({ _id: id, deletedAt: null });
    if (!review) return notFound("Review not found.");
    if (review.customerId?.toString() !== session.user._id.toString()) return forbidden();
    if (review.adminAdded) return forbidden("Admin-added reviews cannot be edited by customers.");

    const body = await req.json() as {
      rating?: number; title?: string; body?: string; images?: string[]; video?: string;
    };

    if (body.rating !== undefined) {
      if (body.rating < 1 || body.rating > 5) return badRequest("Rating must be 1–5.");
      review.rating = body.rating;
    }
    if (body.title    !== undefined) review.title  = body.title?.trim()  || undefined;
    if (body.body     !== undefined) {
      if (!body.body.trim()) return badRequest("Review body cannot be empty.");
      review.body = body.body.trim();
    }
    if (body.images   !== undefined) review.images = Array.isArray(body.images) ? body.images.filter(Boolean).slice(0, 5) : [];
    if (body.video    !== undefined) review.video  = body.video?.trim() || undefined;

    review.status = REVIEW_STATUS.PENDING;
    await review.save();

    recalculateProductRating(review.productId).catch((e) =>
      console.error("[Review] recalculate failed:", e)
    );

    return ok(review);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.user) return unauthorized();

    const { id } = await params;
    await connectDB();

    const review = await Review.findOne({ _id: id, deletedAt: null });
    if (!review) return notFound("Review not found.");
    if (review.customerId?.toString() !== session.user._id.toString()) return forbidden();

    review.deletedAt = new Date();
    await review.save();

    recalculateProductRating(review.productId).catch((e) =>
      console.error("[Review] recalculate failed:", e)
    );

    return ok("Review deleted.");
  } catch (err) {
    return handleApiError(err);
  }
}
