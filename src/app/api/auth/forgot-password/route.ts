import { NextRequest } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { sendEmail } from "@/lib/email/mailer";
import { resetPasswordTemplate } from "@/lib/email/templates";
import { forgotPasswordSchema } from "@/validators/auth.validator";
import { ok, badRequest, handleApiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid email");

    const { email } = parsed.data;

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select(
      "+passwordResetToken +passwordResetExpiry"
    );

    // Always return success to prevent email enumeration
    if (!user) {
      return ok(null, "If an account with this email exists, a reset link has been sent.");
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    sendEmail({
      to: user.email,
      subject: "Reset your SunEra password",
      html: resetPasswordTemplate(user.name, rawToken),
    }).catch((err) => console.error("[Email] Reset password email failed:", err));

    return ok(null, "Password reset link sent. Please check your inbox.");
  } catch (err) {
    return handleApiError(err);
  }
}
