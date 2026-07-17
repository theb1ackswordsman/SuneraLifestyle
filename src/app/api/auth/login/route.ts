import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { signAccessToken, signRefreshToken, signAdminPendingToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { loginSchema } from "@/validators/auth.validator";
import { USER_ROLES } from "@/constants";
import { ok, badRequest, unauthorized, forbidden, tooManyRequests, handleApiError } from "@/lib/api/response";

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const { email, password, rememberMe } = parsed.data;

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +refreshTokens +loginAttempts +lockUntil"
    );

    if (!user || !user.isActive) {
      return unauthorized("Invalid email or password");
    }

    if (user.isLocked()) {
      return tooManyRequests(
        "Account temporarily locked due to too many failed attempts. Try again in 30 minutes."
      );
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      user.loginAttempts = (user.loginAttempts ?? 0) + 1;
      if (user.loginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }
      await user.save();
      const remaining = MAX_ATTEMPTS - user.loginAttempts;
      return unauthorized(
        remaining > 0
          ? `Invalid email or password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
          : "Account locked due to too many failed attempts."
      );
    }

    if (!user.isEmailVerified) {
      return forbidden("Please verify your email address before logging in.");
    }

    // Reset lock on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // Admin detected — do NOT issue full session yet, return pending token
    if (user.role === USER_ROLES.ADMIN) {
      const pendingToken = await signAdminPendingToken(user._id.toString(), user.email);
      return ok(
        { step: "admin-code", pendingToken },
        "Admin account detected. Enter your portal code to continue."
      );
    }

    // Regular user — issue full session
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = await signAccessToken(tokenPayload);
    const refreshExpiry = rememberMe ? "30d" : "7d";
    const refreshToken = await signRefreshToken(tokenPayload, refreshExpiry);

    const tokens = user.refreshTokens ?? [];
    tokens.push(refreshToken);
    if (tokens.length > 5) tokens.splice(0, tokens.length - 5);
    user.refreshTokens = tokens;
    await user.save();

    await setAuthCookies(accessToken, refreshToken);

    const safeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    };

    return ok({ user: safeUser }, `Welcome back, ${user.name.split(" ")[0]}!`);
  } catch (err) {
    return handleApiError(err);
  }
}
