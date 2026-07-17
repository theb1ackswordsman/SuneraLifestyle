import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { verifyAdminPendingToken, signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { USER_ROLES } from "@/constants";
import { ok, badRequest, unauthorized, forbidden, handleApiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pendingToken, adminCode } = body as { pendingToken?: string; adminCode?: string };

    if (!pendingToken || !adminCode) {
      return badRequest("Pending token and admin code are required.");
    }

    const pending = await verifyAdminPendingToken(pendingToken);
    if (!pending) {
      return unauthorized("Session expired. Please log in again.");
    }

    const expectedCode = process.env.ADMIN_PORTAL_CODE;
    if (!expectedCode || adminCode.trim() !== expectedCode.trim()) {
      return forbidden("Invalid admin portal code.");
    }

    await connectDB();
    const user = await User.findById(pending.userId).select("+refreshTokens");
    if (!user || !user.isActive || user.role !== USER_ROLES.ADMIN) {
      return unauthorized("Admin account not found or disabled.");
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      adminVerified: true,
    };

    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload);

    const tokens = user.refreshTokens ?? [];
    tokens.push(refreshToken);
    if (tokens.length > 5) tokens.splice(0, tokens.length - 5);
    user.refreshTokens = tokens;
    user.lastLoginAt = new Date();
    await user.save();

    await setAuthCookies(accessToken, refreshToken);

    return ok(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      "Welcome to the Admin Portal."
    );
  } catch (err) {
    return handleApiError(err);
  }
}
