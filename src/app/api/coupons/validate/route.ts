import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Coupon } from "@/models/coupon.model";
import { Order } from "@/models/order.model";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { code, cartTotal } = await req.json();
  if (!code || cartTotal == null)
    return NextResponse.json({ valid: false, error: "code and cartTotal are required" }, { status: 400 });

  await connectDB();
  const session = await getServerSession();
  const now     = new Date();
  const coupon  = await Coupon.findOne({
    code: String(code).toUpperCase().trim(),
    isActive: true,
    deletedAt: null,
    startDate: { $lte: now },
    endDate:   { $gte: now },
  });

  if (!coupon) return NextResponse.json({ valid: false, error: "Invalid or expired coupon code." });
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit)
    return NextResponse.json({ valid: false, error: "This coupon has reached its total usage limit." });

  // Per-user usage limit check
  const userId = session.user?._id;
  if (session.isAuthenticated && userId && coupon.userLimit != null) {
    const userLimit = coupon.userLimit;
    const userUsageInOrders = await Order.countDocuments({
      userId,
      couponCode: coupon.code,
      status: { $ne: "cancelled" },
    });
    const userUsageInArray = (coupon.usedBy ?? []).filter((id) => String(id) === String(userId)).length;
    const totalUserUsage = Math.max(userUsageInOrders, userUsageInArray);

    if (totalUserUsage >= userLimit) {
      return NextResponse.json({ valid: false, error: "You have already reached the usage limit for this coupon." });
    }
  }

  if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount)
    return NextResponse.json({
      valid: false,
      error: `Minimum order of ₹${coupon.minOrderAmount} required to use this coupon.`,
    });

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = Math.round((cartTotal * coupon.value) / 100);
    if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
  } else if (coupon.type === "flat") {
    discount = Math.min(coupon.value, cartTotal);
  } else if (coupon.type === "free_shipping") {
    discount = 99; // shipping fee
  }

  return NextResponse.json({
    valid:       true,
    discount,
    code:        coupon.code,
    description: coupon.description,
    type:        coupon.type,
    value:       coupon.value,
  });
}
