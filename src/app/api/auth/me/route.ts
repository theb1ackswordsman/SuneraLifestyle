import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getAccessToken } from "@/lib/auth/cookies";
import { ok, unauthorized, handleApiError } from "@/lib/api/response";

export async function GET(_req: NextRequest) {
  try {
    const token = await getAccessToken();
    if (!token) return unauthorized();

    const payload = await verifyAccessToken(token);
    if (!payload) return unauthorized();

    await connectDB();
    const user = await User.findById(payload.userId).lean();
    if (!user || !user.isActive) return unauthorized("User not found");

    return ok({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
