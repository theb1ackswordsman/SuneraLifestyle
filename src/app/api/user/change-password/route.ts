import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session.isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: "Both fields required" }, { status: 400 });
  if (newPassword.length < 8)
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  await connectDB();
  const user = await User.findById(session.user!._id).select("+password");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.password)
    return NextResponse.json(
      { error: "This account uses Google sign-in — no password to change" },
      { status: 400 },
    );
  const valid = await user.comparePassword(currentPassword);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  user.password = newPassword;
  await user.save();
  return NextResponse.json({ message: "Password updated successfully" });
}
