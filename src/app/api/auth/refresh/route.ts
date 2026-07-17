import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { setAuthCookies, getRefreshToken } from "@/lib/auth/cookies";
import { ok, unauthorized, handleApiError } from "@/lib/api/response";

export async function POST(_req: NextRequest) {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return unauthorized("No refresh token");

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) return unauthorized("Invalid refresh token");

    await connectDB();
    const user = await User.findById(payload.userId).select("+refreshTokens");
    if (!user || !user.isActive) return unauthorized("User not found");

    // Rotate: verify the token is still in our list
    const idx = user.refreshTokens.indexOf(refreshToken);
    if (idx === -1) return unauthorized("Token has been revoked");

    const tokenPayload = { userId: user._id.toString(), email: user.email, role: user.role };
    const newAccessToken = await signAccessToken(tokenPayload);
    const newRefreshToken = await signRefreshToken(tokenPayload);

    // Rotate refresh token
    user.refreshTokens[idx] = newRefreshToken;
    await user.save();

    await setAuthCookies(newAccessToken, newRefreshToken);
    return ok({ accessToken: newAccessToken }, "Token refreshed");
  } catch (err) {
    return handleApiError(err);
  }
}
