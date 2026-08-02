import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { sendEmail } from "@/lib/email/mailer";
import { verifyOtpTemplate } from "@/lib/email/templates";
import { assignEmailOtp } from "@/lib/auth/otp";
import { registerSchema } from "@/validators/auth.validator";
import { ok, conflict, badRequest, handleApiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const { name, email, password, phone } = parsed.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return conflict("An account with this email already exists");
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || undefined,
    });

    // Generate a 6-digit email verification OTP
    const otp = assignEmailOtp(user);
    await user.save();

    // Send OTP email (non-blocking)
    sendEmail({
      to: user.email,
      subject: `${otp} is your SunEra verification code`,
      html: verifyOtpTemplate(user.name, otp),
    }).catch((err) => console.error("[Email] Failed to send verification OTP:", err));

    return ok(
      { userId: user._id.toString(), email: user.email },
      "Account created! We've sent a 6-digit verification code to your email."
    );
  } catch (err) {
    return handleApiError(err);
  }
}
