import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { verifyRefreshToken } from "@/lib/auth/jwt";
import { clearAuthCookies, getRefreshToken } from "@/lib/auth/cookies";
import { ok, handleApiError } from "@/lib/api/response";

export async function POST(_req: NextRequest) {
  try {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      try {
        await connectDB();
        const payload = await verifyRefreshToken(refreshToken);
        if (payload) {
          // Remove this refresh token from the user's token list
          await User.findByIdAndUpdate(payload.userId, {
            $pull: { refreshTokens: refreshToken },
          });
        }
      } catch {
        // Silent — still clear cookies even if token is invalid
      }
    }

    await clearAuthCookies();
    return ok(null, "Logged out successfully");
  } catch (err) {
    return handleApiError(err);
  }
}
