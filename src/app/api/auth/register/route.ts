import { NextRequest } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { sendEmail } from "@/lib/email/mailer";
import { verifyEmailTemplate } from "@/lib/email/templates";
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

    // Generate email verification token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || undefined,
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: expiry,
    });

    // Send verification email (non-blocking)
    sendEmail({
      to: user.email,
      subject: "Verify your SunEra account",
      html: verifyEmailTemplate(user.name, rawToken),
    }).catch((err) => console.error("[Email] Failed to send verification:", err));

    return ok(
      { userId: user._id.toString(), email: user.email },
      "Account created! Please check your email to verify your account."
    );
  } catch (err) {
    return handleApiError(err);
  }
}
