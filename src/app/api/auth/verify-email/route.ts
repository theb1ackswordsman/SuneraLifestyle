import { NextRequest } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { sendEmail } from "@/lib/email/mailer";
import { welcomeTemplate } from "@/lib/email/templates";
import { ok, badRequest, notFound, handleApiError } from "@/lib/api/response";

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

// Resend a verification OTP
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return badRequest("Email is required");

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+emailOtp +emailOtpExpiry +emailOtpAttempts"
    );

    // Always return success to prevent email enumeration
    if (!user || user.isEmailVerified) {
      return ok(null, "If an unverified account exists, a new code has been sent.");
    }

    const { assignEmailOtp } = await import("@/lib/auth/otp");
    const { verifyOtpTemplate } = await import("@/lib/email/templates");

    const otp = assignEmailOtp(user);
    await user.save();

    sendEmail({
      to: user.email,
      subject: `${otp} is your SunEra verification code`,
      html: verifyOtpTemplate(user.name, otp),
    }).catch(console.error);

    return ok(null, "A new verification code has been sent. Please check your inbox.");
  } catch (err) {
    return handleApiError(err);
  }
}
