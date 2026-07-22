import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Product } from "@/models/product.model";
import { Review } from "@/models/review.model";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url      = new URL(req.url);
  const page     = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit    = 8;
  const skip     = (page - 1) * limit;

  await connectDB();

  const product = await Product.findOne({ slug, isActive: true, deletedAt: null })
    .select("_id")
    .lean<{ _id: unknown } | null>();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const [reviews, total] = await Promise.all([
    Review.find({ productId: product._id, isApproved: true, deletedAt: null })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name avatar")
      .lean<Record<string, unknown>[]>(),
    Review.countDocuments({ productId: product._id, isApproved: true, deletedAt: null }),
  ]);

  const data = reviews.map((r) => {
    const user = r.userId as Record<string, unknown> | null;
    return {
      _id:               String(r._id),
      rating:            Number(r.rating),
      title:             String(r.title ?? ""),
      body:              String(r.body ?? ""),
      isVerifiedPurchase: Boolean(r.isVerifiedPurchase),
      helpfulVotes:      Number(r.helpfulVotes ?? 0),
      images:            (r.images as string[] | undefined) ?? [],
      createdAt:         String(r.createdAt),
      reviewer: {
        name:   user ? String(user.name ?? "Customer") : "Customer",
        avatar: user?.avatar ? String(user.avatar) : null,
      },
    };
  });

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) || 1 });
}
