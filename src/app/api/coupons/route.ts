import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Coupon } from "@/models/coupon.model";
import { Order } from "@/models/order.model";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// Public: returns all currently active & valid coupons (no sensitive fields)
export async function GET() {
  await connectDB();
  const session = await getServerSession();
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    deletedAt: null,
    startDate: { $lte: now },
    endDate:   { $gte: now },
    $or: [{ usageLimit: null }, { $expr: { $lt: ["$usageCount", "$usageLimit"] } }],
  })
    .sort({ createdAt: -1 })
    .select("code description type value minOrderAmount maxDiscountAmount userLimit usedBy endDate")
    .lean();

  const validCoupons = [];
  const userId = session.user?._id;
  for (const c of coupons) {
    if (session.isAuthenticated && userId && c.userLimit != null) {
      const userLimit = c.userLimit;
      const userUsageInOrders = await Order.countDocuments({
        userId,
        couponCode: c.code,
        status: { $ne: "cancelled" },
      });
      const userUsageInArray = (c.usedBy ?? []).filter((id) => String(id) === String(userId)).length;
      const totalUserUsage = Math.max(userUsageInOrders, userUsageInArray);
      if (totalUserUsage >= userLimit) {
        continue;
      }
    }
    validCoupons.push(c);
  }

  return NextResponse.json({
    data: validCoupons.map((c) => ({
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
