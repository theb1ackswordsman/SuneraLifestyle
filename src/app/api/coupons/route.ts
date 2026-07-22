import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Coupon } from "@/models/coupon.model";

export const dynamic = "force-dynamic";

// Public: returns all currently active & valid coupons (no sensitive fields)
export async function GET() {
  await connectDB();
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    deletedAt: null,
    startDate: { $lte: now },
    endDate:   { $gte: now },
    $or: [{ usageLimit: null }, { $expr: { $lt: ["$usageCount", "$usageLimit"] } }],
  })
    .sort({ createdAt: -1 })
    .select("code description type value minOrderAmount maxDiscountAmount endDate")
    .lean();

  return NextResponse.json({
    data: coupons.map((c) => ({
      _id:              String(c._id),
      code:             c.code,
      description:      c.description ?? "",
      type:             c.type,
      value:            c.value,
      minOrderAmount:   c.minOrderAmount ?? 0,
      maxDiscountAmount: c.maxDiscountAmount,
      endDate:          c.endDate?.toISOString() ?? null,
    })),
  });
}
