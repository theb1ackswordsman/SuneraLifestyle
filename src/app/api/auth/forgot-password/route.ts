import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { sendEmail } from "@/lib/email/mailer";
import { resetPasswordOtpTemplate } from "@/lib/email/templates";
import { generateOtp, hashOtp, OTP_TTL_MS } from "@/lib/auth/otp";
import { forgotPasswordSchema } from "@/validators/auth.validator";
import { ok, badRequest, notFound, serverError, handleApiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid email");

    const { email } = parsed.data;
    const lowerEmail = email.toLowerCase();

    await connectDB();
    const user = await User.findOne({ email: lowerEmail, isActive: true }).select(
      "+passwordResetToken +passwordResetExpiry +passwordResetAttempts"
    );

    // The email must belong to an existing account to reset its password.
    if (!user) {
      return notFound("No account found with this email. Please check the address or create an account.");
    }

    // Issue a fresh 6-digit OTP, valid for 2 minutes.
    const otp = generateOtp();
    user.passwordResetToken = hashOtp(otp);
    user.passwordResetExpiry = new Date(Date.now() + OTP_TTL_MS);
    user.passwordResetAttempts = 0;
    await user.save();

    // Blocking send so a delivery failure surfaces as a real error.
    try {
      await sendEmail({
        to: user.email,
        subject: `${otp} is your SunEra password reset code`,
        html: resetPasswordOtpTemplate(user.name, otp),
      });
    } catch (err) {
      console.error("[Email] Failed to send password reset OTP:", err);
      // No code delivered → clear the token so nothing lingers.
      user.passwordResetToken = undefined;
      user.passwordResetExpiry = undefined;
      await user.save();
      return serverError("We couldn't send your reset code right now. Please try again in a moment.");
    }

    return ok({ email: lowerEmail }, "We've sent a 6-digit reset code to your email.");
  } catch (err) {
    return handleApiError(err);
  }
}
