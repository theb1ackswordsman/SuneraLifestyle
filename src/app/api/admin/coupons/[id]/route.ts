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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(); if (denied) return denied;
  const { id }  = await params;
  const body    = await req.json();
  await connectDB();
  const update: Record<string, unknown> = {};
  if (body.code             != null) update.code             = String(body.code).toUpperCase().trim();
  if (body.description      != null) update.description      = body.description;
  if (body.type             != null) update.type             = body.type;
  if (body.value            != null) update.value            = Number(body.value);
  if (body.minOrderAmount   != null) update.minOrderAmount   = Number(body.minOrderAmount);
  if (body.maxDiscountAmount != null) update.maxDiscountAmount = Number(body.maxDiscountAmount);
  if (body.usageLimit       != null) update.usageLimit       = body.usageLimit ? Number(body.usageLimit) : undefined;
  if (body.startDate        != null) update.startDate        = new Date(body.startDate);
  if (body.endDate          != null) update.endDate          = new Date(body.endDate);
  if (body.isActive         != null) update.isActive         = Boolean(body.isActive);

  const coupon = await Coupon.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
  if (!coupon) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ message: "Updated" });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(); if (denied) return denied;
  const { id } = await params;
  await connectDB();
  await Coupon.findByIdAndUpdate(id, { $set: { deletedAt: new Date(), isActive: false } });
  return NextResponse.json({ message: "Deleted" });
}
