import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Coupon } from "@/models/coupon.model";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const s = await getServerSession();
  if (!s.isAuthenticated || s.user?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET() {
  const denied = await requireAdmin(); if (denied) return denied;
  await connectDB();
  const coupons = await Coupon.find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .lean();
  const data = coupons.map((c) => ({
    _id:              String(c._id),
    code:             c.code,
    description:      c.description ?? "",
    type:             c.type,
    value:            c.value,
    minOrderAmount:   c.minOrderAmount ?? 0,
    maxDiscountAmount: c.maxDiscountAmount,
    usageLimit:       c.usageLimit,
    usageCount:       c.usageCount,
    isActive:         c.isActive,
    startDate:        c.startDate?.toISOString() ?? null,
    endDate:          c.endDate?.toISOString() ?? null,
    createdAt:        (c.createdAt as Date).toISOString(),
  }));
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  const session = await getServerSession();
  const body = await req.json();
  const { code, description, type, value, minOrderAmount, maxDiscountAmount, usageLimit, startDate, endDate, isActive } = body;
  if (!code || !type || value == null || !startDate || !endDate)
    return NextResponse.json({ error: "code, type, value, startDate, endDate are required" }, { status: 400 });
  await connectDB();
  const exists = await Coupon.findOne({ code: code.toUpperCase().trim(), deletedAt: null });
  if (exists) return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
  const coupon = await Coupon.create({
    code: code.toUpperCase().trim(),
    description: description ?? "",
    type,
    value: Number(value),
    minOrderAmount: Number(minOrderAmount ?? 0),
    maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
    usageLimit: usageLimit ? Number(usageLimit) : undefined,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    isActive: isActive !== false,
    createdBy: session.user!._id,
  });
  return NextResponse.json({ data: { _id: String(coupon._id), code: coupon.code }, message: "Coupon created" }, { status: 201 });
}
