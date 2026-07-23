import mongoose from "mongoose";
import { Review, REVIEW_STATUS } from "@/models/review.model";
import { Product } from "@/models/product.model";

export async function recalculateProductRating(
  productId: string | mongoose.Types.ObjectId
): Promise<void> {
  const reviews = await Review.find({
    productId,
    status:    REVIEW_STATUS.APPROVED,
    deletedAt: null,
  })
    .select("rating")
    .lean();

  const count = reviews.length;
  const average =
    count > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  await Product.findByIdAndUpdate(productId, {
    $set: {
      "reviewSummary.average":      average,
      "reviewSummary.count":        count,
      "reviewSummary.distribution": distribution,
    },
  });
}
