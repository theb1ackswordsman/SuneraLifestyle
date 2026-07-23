import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Review, REVIEW_STATUS } from "@/models/review.model";
import { Order } from "@/models/order.model";
import { getServerSession } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/mailer";
import { reviewSubmittedTemplate } from "@/lib/email/templates";
import {
  ok, created, unauthorized, badRequest, forbidden, conflict, handleApiError,
} from "@/lib/api/response";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const productId    = searchParams.get("productId");
    const mine         = searchParams.get("mine") === "true";
    const page         = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit        = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
    const sort         = searchParams.get("sort") ?? "newest";
    const star         = searchParams.get("star");
    const withImages   = searchParams.get("withImages")   === "true";
    const withVideos   = searchParams.get("withVideos")   === "true";
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";

    await connectDB();

    // ── Customer's own reviews ────────────────────────────────────────────────
    if (mine) {
      const session = await getServerSession();
      if (!session.isAuthenticated || !session.user) return unauthorized();

      const q: Record<string, unknown> = { customerId: session.user._id, deletedAt: null };
      const [reviews, total] = await Promise.all([
        Review.find(q).sort({ createdAt: -1 }).populate("productId", "name slug images").lean(),
        Review.countDocuments(q),
      ]);
      return ok({ reviews, total });
    }

    // ── Public approved reviews ───────────────────────────────────────────────
    if (!productId) return badRequest("productId is required.");

    const q: Record<string, unknown> = { productId, status: REVIEW_STATUS.APPROVED, deletedAt: null };

    if (star) {
      const n = parseInt(star, 10);
      if (n >= 1 && n <= 5) q.rating = n;
    }
    if (withImages)  q.images = { $exists: true, $not: { $size: 0 } };
    if (withVideos)  q.video  = { $exists: true, $ne: "" };
    if (verifiedOnly) q.verifiedPurchase = true;

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest:  { createdAt: -1 },
      oldest:  { createdAt:  1 },
      highest: { rating:    -1 },
      lowest:  { rating:     1 },
      helpful: { helpfulCount: -1 },
    };
    const sortOrder = sortMap[sort] ?? sortMap.newest;

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find(q).sort(sortOrder).skip(skip).limit(limit).populate("customerId", "name").lean(),
      Review.countDocuments(q),
    ]);

    const totalPages = Math.ceil(total / limit);
    return ok({ reviews, total, page, totalPages, hasNext: page < totalPages });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.user) return unauthorized();

    const body = await req.json() as {
      productId?: string;
      rating?:    number;
      title?:     string;
      body?:      string;
      images?:    string[];
      video?:     string;
    };

    const { productId, rating, title, body: reviewBody, images, video } = body;

    if (!productId)                            return badRequest("productId is required.");
    if (!rating || rating < 1 || rating > 5)  return badRequest("Rating must be between 1 and 5.");
    if (!reviewBody?.trim())                   return badRequest("Review body is required.");

    await connectDB();

    // Must have a delivered order containing this product
    const order = await Order.findOne({
      userId:            session.user._id,
      status:            "delivered",
      "items.productId": productId,
    }).lean();

    if (!order) {
      return forbidden("You can only review products you have purchased and received.");
    }

    // One review per product per user
    const existing = await Review.findOne({
      customerId: session.user._id,
      productId,
      deletedAt:  null,
      status:     { $ne: REVIEW_STATUS.REJECTED },
    });
    if (existing) return conflict("You have already reviewed this product.");

    const review = await Review.create({
      productId,
      orderId:          order._id,
      customerId:       session.user._id,
      rating,
      title:            title?.trim() || undefined,
      body:             reviewBody.trim(),
      images:           Array.isArray(images) ? images.filter(Boolean).slice(0, 5) : [],
      video:            video?.trim() || undefined,
      status:           REVIEW_STATUS.PENDING,
      verifiedPurchase: true,
    });

    sendEmail({
      to:      session.user.email,
      subject: "Review Received – SunEra Lifestyle",
      html:    reviewSubmittedTemplate({
        productName: "your product",
        trackUrl:    `${BASE_URL}/account/reviews`,
      }),
    }).catch((e) => console.error("[Review email] submitted:", e));

    return created(review);
  } catch (err) {
    return handleApiError(err);
  }
}
