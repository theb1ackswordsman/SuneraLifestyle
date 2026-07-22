import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connection";
import { Product } from "@/models/product.model";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => mongoose.Types.ObjectId.isValid(s));

  if (!ids.length) return NextResponse.json({ data: [] });

  await connectDB();

  const products = await Product.find({
    _id: { $in: ids },
    isActive: true,
    deletedAt: null,
  })
    .select("name slug basePrice compareAtPrice images reviewSummary.average reviewSummary.count isNewArrival isBestSeller stock")
    .lean<Record<string, unknown>[]>();

  const data = products.map((p) => {
    const rs = p.reviewSummary as Record<string, unknown> | null;
    return {
      _id:           String(p._id),
      name:          String(p.name ?? ""),
      slug:          String(p.slug ?? ""),
      basePrice:     Number(p.basePrice ?? 0),
      compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : undefined,
      images:        (p.images as string[] | undefined) ?? [],
      stock:         Number(p.stock ?? 0),
      isNewArrival:  Boolean(p.isNewArrival),
      isBestSeller:  Boolean(p.isBestSeller),
      reviewSummary: { average: Number(rs?.average ?? 0), count: Number(rs?.count ?? 0) },
    };
  });

  return NextResponse.json({ data });
}
