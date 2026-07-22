import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session.isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = await User.findById(session.user!._id).select("name email phone avatar createdAt googleId");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ data: user });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session.isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  if (body.name?.trim()) allowed.name = body.name.trim();
  if (body.phone !== undefined) allowed.phone = body.phone;
  if (body.avatar !== undefined) allowed.avatar = body.avatar;
  await connectDB();
  const user = await User.findByIdAndUpdate(
    session.user!._id,
    { $set: allowed },
    { new: true, runValidators: true },
  ).select("name email phone avatar");
  return NextResponse.json({ data: user, message: "Profile updated" });
}
