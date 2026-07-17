import { NextRequest } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { resetPasswordSchema } from "@/validators/auth.validator";
import { ok, badRequest, notFound, handleApiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    const { token, password } = parsed.data;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    await connectDB();
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpiry +refreshTokens");

    if (!user) {
      return notFound("Invalid or expired reset link. Please request a new password reset.");
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.refreshTokens = []; // Invalidate all sessions
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    return ok(null, "Password reset successfully. You can now log in with your new password.");
  } catch (err) {
    return handleApiError(err);
  }
}
