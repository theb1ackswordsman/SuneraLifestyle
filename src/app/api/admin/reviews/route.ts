import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Review, REVIEW_STATUS } from "@/models/review.model";
import { Product } from "@/models/product.model";
import { recalculateProductRating } from "@/lib/shop/recalculate-rating";
import { ok, created, forbidden, badRequest, notFound, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();

    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit  = Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10));
    const status = searchParams.get("status") ?? "all";
    const sort   = searchParams.get("sort")   ?? "newest";
    const star   = searchParams.get("star");
    const search = searchParams.get("search")?.trim();

    await connectDB();

    const q: Record<string, unknown> = { deletedAt: null };
    if (status !== "all") q.status = status;
    if (star) {
      const n = parseInt(star, 10);
      if (n >= 1 && n <= 5) q.rating = n;
    }
    if (search) {
      const products = await Product.find({ name: { $regex: search, $options: "i" } }).select("_id").lean();
      q.productId = { $in: products.map((p) => p._id) };
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest:  { createdAt: -1 },
      oldest:  { createdAt:  1 },
      highest: { rating:    -1 },
      lowest:  { rating:     1 },
    };

    const skip = (page - 1) * limit;
    const [reviews, total, pending, approved, rejected, hidden] = await Promise.all([
      Review.find(q).sort(sortMap[sort] ?? sortMap.newest).skip(skip).limit(limit)
        .populate("customerId", "name email")
        .populate("productId", "name slug images")
        .lean(),
      Review.countDocuments(q),
      Review.countDocuments({ status: REVIEW_STATUS.PENDING,  deletedAt: null }),
      Review.countDocuments({ status: REVIEW_STATUS.APPROVED, deletedAt: null }),
      Review.countDocuments({ status: REVIEW_STATUS.REJECTED, deletedAt: null }),
      Review.countDocuments({ status: REVIEW_STATUS.HIDDEN,   deletedAt: null }),
    ]);

    return ok({ reviews, total, page, totalPages: Math.ceil(total / limit), stats: { pending, approved, rejected, hidden } });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();

    const body = await req.json() as {
      productId?: string; rating?: number; title?: string;
      body?: string; images?: string[]; video?: string; adminAddedName?: string;
    };

    const { productId, rating, title, body: reviewBody, images, video, adminAddedName } = body;

    if (!productId)                           return badRequest("productId is required.");
    if (!rating || rating < 1 || rating > 5)  return badRequest("Rating must be 1–5.");
    if (!reviewBody?.trim())                  return badRequest("Review body is required.");

    await connectDB();

    const product = await Product.findOne({ _id: productId, isActive: true }).lean();
    if (!product) return notFound("Product not found.");

    const review = await Review.create({
      productId,
      rating,
      title:            title?.trim() || undefined,
      body:             reviewBody.trim(),
      images:           Array.isArray(images) ? images.filter(Boolean).slice(0, 5) : [],
      video:            video?.trim() || undefined,
      adminAddedName:   adminAddedName?.trim() || "Anonymous",
      status:           REVIEW_STATUS.APPROVED,
      adminAdded:       true,
      verifiedPurchase: false,
    });

    recalculateProductRating(productId).catch((e) => console.error("[Review] recalculate failed:", e));

    return created(review);
  } catch (err) {
    return handleApiError(err);
  }
}
