import { NextRequest } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { PendingSignup } from "@/models/pending-signup.model";
import { sendEmail } from "@/lib/email/mailer";
import { welcomeTemplate } from "@/lib/email/templates";
import { ok, badRequest, notFound, serverError, handleApiError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) return badRequest("Verification token is required");

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    await connectDB();
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpiry");

    if (!user) return notFound("Invalid or expired verification link. Please request a new one.");

    if (user.isEmailVerified) {
      return ok({ alreadyVerified: true }, "Email already verified");
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    // Send welcome email
    sendEmail({
      to: user.email,
      subject: "Welcome to SunEra Lifestyle! 🎉",
      html: welcomeTemplate(user.name),
    }).catch((err) => console.error("[Email] Welcome email failed:", err));

    return ok({ verified: true }, "Email verified successfully! You can now log in.");
  } catch (err) {
    return handleApiError(err);
  }
}

// Resend a verification OTP for a pending (unverified) signup
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return badRequest("Email is required");

    await connectDB();
    const lowerEmail = String(email).toLowerCase();
    const pending = await PendingSignup.findOne({ email: lowerEmail });

    // Always return success to prevent email enumeration
    if (!pending) {
      return ok(null, "If a pending signup exists, a new code has been sent.");
    }

    const { generateOtp, hashOtp, OTP_TTL_MS } = await import("@/lib/auth/otp");
    const { verifyOtpTemplate } = await import("@/lib/email/templates");

    const otp = generateOtp();
    pending.otp = hashOtp(otp);
    pending.otpExpiry = new Date(Date.now() + OTP_TTL_MS);
    pending.attempts = 0;
    await pending.save();

    // Blocking send so resend failures surface as a real error.
    try {
      await sendEmail({
        to: lowerEmail,
        subject: `${otp} is your SunEra verification code`,
        html: verifyOtpTemplate(pending.name, otp),
      });
    } catch (err) {
      console.error("[Email] Failed to resend verification OTP:", err);
      return serverError(
        "We couldn't send the code right now. Please try again in a moment."
      );
    }

    return ok(null, "A new verification code has been sent. Please check your inbox.");
  } catch (err) {
    return handleApiError(err);
  }
}
