import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { hashOtp, OTP_MAX_ATTEMPTS } from "@/lib/auth/otp";
import { forgotPasswordVerifySchema } from "@/validators/auth.validator";
import { ok, badRequest, tooManyRequests, handleApiError } from "@/lib/api/response";

/**
 * Step 2 of the password reset: validate the emailed OTP before revealing the
 * new-password card. The code is NOT consumed here — the final reset step
 * re-verifies it — so the same 2-minute window covers both steps.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordVerifySchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    const { email, otp } = parsed.data;

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select(
      "+passwordResetToken +passwordResetExpiry +passwordResetAttempts"
    );

    if (!user || !user.passwordResetToken || !user.passwordResetExpiry) {
      return badRequest("Please request a new reset code.");
    }

    if (user.passwordResetExpiry < new Date()) {
      return badRequest("Your reset code has expired. Please request a new one.");
    }

    if ((user.passwordResetAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      user.passwordResetToken = undefined;
      user.passwordResetExpiry = undefined;
      await user.save();
      return tooManyRequests("Too many incorrect attempts. Please request a new code.");
    }

    if (hashOtp(otp) !== user.passwordResetToken) {
      user.passwordResetAttempts = (user.passwordResetAttempts ?? 0) + 1;
      await user.save();
      const remaining = OTP_MAX_ATTEMPTS - user.passwordResetAttempts;
      return badRequest(
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
          : "Too many incorrect attempts. Please request a new code."
      );
    }

    return ok({ valid: true }, "Code verified. You can now set a new password.");
  } catch (err) {
    return handleApiError(err);
  }
}
