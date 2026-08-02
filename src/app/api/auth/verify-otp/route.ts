import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { PendingSignup } from "@/models/pending-signup.model";
import { hashOtp, OTP_MAX_ATTEMPTS } from "@/lib/auth/otp";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { sendEmail } from "@/lib/email/mailer";
import { welcomeTemplate } from "@/lib/email/templates";
import { verifyOtpSchema } from "@/validators/auth.validator";
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
    const lowerEmail = email.toLowerCase();

    const pending = await PendingSignup.findOne({ email: lowerEmail });

    if (!pending) {
      // Maybe they already verified (e.g. double submit) — guide them to sign in.
      const existing = await User.findOne({ email: lowerEmail });
      if (existing?.isEmailVerified) {
        return ok({ alreadyVerified: true }, "Your email is already verified. Please sign in.");
      }
      return badRequest("Your verification code has expired. Please sign up again.");
    }

    if (pending.otpExpiry < new Date()) {
      await PendingSignup.deleteOne({ _id: pending._id });
      return badRequest("Your verification code has expired. Please sign up again.");
    }

    if ((pending.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      await PendingSignup.deleteOne({ _id: pending._id });
      return tooManyRequests("Too many incorrect attempts. Please sign up again to get a new code.");
    }

    if (hashOtp(otp) !== pending.otp) {
      pending.attempts = (pending.attempts ?? 0) + 1;
      await pending.save();
      const remaining = OTP_MAX_ATTEMPTS - pending.attempts;
      return badRequest(
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
          : "Too many incorrect attempts. Please sign up again to get a new code."
      );
    }

    // ── Correct code — create the real account now ──
    const already = await User.findOne({ email: lowerEmail });
    if (already?.isEmailVerified) {
      await PendingSignup.deleteOne({ _id: pending._id });
      return ok({ alreadyVerified: true }, "Your email is already verified. Please sign in.");
    }
    if (already) {
      // Stray unverified record (shouldn't normally exist) — clear it first.
      await User.deleteOne({ _id: already._id });
    }

    const created = await User.create({
      name: pending.name,
      email: pending.email,
      phone: pending.phone || undefined,
      isEmailVerified: true,
      lastLoginAt: new Date(),
    });

    // Issue a full session so the user lands signed in.
    const tokenPayload = {
      userId: created._id.toString(),
      email: created.email,
      role: created.role,
    };
    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload, "7d");

    // Copy the already-hashed password + store the refresh token via updateOne,
    // which bypasses the pre-save hook so the bcrypt hash isn't hashed again.
    await User.updateOne(
      { _id: created._id },
      { $set: { password: pending.passwordHash, refreshTokens: [refreshToken] } }
    );
    await PendingSignup.deleteOne({ _id: pending._id });

    // Welcome email is non-critical — don't block verification on it.
    sendEmail({
      to: created.email,
      subject: "Welcome to SunEra Lifestyle! 🎉",
      html: welcomeTemplate(created.name),
    }).catch((err) => console.error("[Email] Welcome email failed:", err));

    await setAuthCookies(accessToken, refreshToken);

    const safeUser = {
      id: created._id.toString(),
      name: created.name,
      email: created.email,
      role: created.role,
      avatar: created.avatar,
      isEmailVerified: true,
    };

    return ok(
      { verified: true, user: safeUser },
      `Welcome to SunEra, ${created.name.split(" ")[0]}!`
    );
  } catch (err) {
    return handleApiError(err);
  }
}
