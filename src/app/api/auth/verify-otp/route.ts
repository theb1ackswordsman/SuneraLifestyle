import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { hashOtp, OTP_MAX_ATTEMPTS } from "@/lib/auth/otp";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { sendEmail } from "@/lib/email/mailer";
import { welcomeTemplate } from "@/lib/email/templates";
import { verifyOtpSchema } from "@/validators/auth.validator";
import { USER_ROLES } from "@/constants";
import { ok, badRequest, tooManyRequests, handleApiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const { email, otp } = parsed.data;

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+emailOtp +emailOtpExpiry +emailOtpAttempts +refreshTokens"
    );

    if (!user || !user.isActive) {
      return badRequest("Invalid or expired code. Please request a new one.");
    }

    if (user.isEmailVerified) {
      return ok({ alreadyVerified: true }, "Your email is already verified. Please sign in.");
    }

    if (!user.emailOtp || !user.emailOtpExpiry || user.emailOtpExpiry < new Date()) {
      return badRequest("Your code has expired. Please request a new one.");
    }

    if ((user.emailOtpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      // Burn the code so a fresh one must be requested
      user.emailOtp = undefined;
      user.emailOtpExpiry = undefined;
      await user.save();
      return tooManyRequests("Too many incorrect attempts. Please request a new code.");
    }

    if (hashOtp(otp) !== user.emailOtp) {
      user.emailOtpAttempts = (user.emailOtpAttempts ?? 0) + 1;
      await user.save();
      const remaining = OTP_MAX_ATTEMPTS - user.emailOtpAttempts;
      return badRequest(
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
          : "Too many incorrect attempts. Please request a new code."
      );
    }

    // ── Correct code — verify the account ──
    user.isEmailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;
    user.emailOtpAttempts = 0;
    user.lastLoginAt = new Date();

    // Send welcome email (non-blocking)
    sendEmail({
      to: user.email,
      subject: "Welcome to SunEra Lifestyle! 🎉",
      html: welcomeTemplate(user.name),
    }).catch((err) => console.error("[Email] Welcome email failed:", err));

    // Admins must still enter their portal code via the login page — don't auto-login
    if (user.role === USER_ROLES.ADMIN) {
      await user.save();
      return ok(
        { verified: true, requiresLogin: true },
        "Email verified! Please sign in to continue."
      );
    }

    // Regular user — issue a full session so they land signed in
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload, "7d");

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

    return ok(
      { verified: true, user: safeUser },
      `Welcome to SunEra, ${user.name.split(" ")[0]}!`
    );
  } catch (err) {
    return handleApiError(err);
  }
}
