import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { PendingSignup } from "@/models/pending-signup.model";
import { sendEmail } from "@/lib/email/mailer";
import { verifyOtpTemplate } from "@/lib/email/templates";
import { generateOtp, hashOtp, OTP_TTL_MS } from "@/lib/auth/otp";
import { registerSchema } from "@/validators/auth.validator";
import { ok, conflict, badRequest, serverError, handleApiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const { name, email, password, phone } = parsed.data;
    const lowerEmail = email.toLowerCase();

    // Only a VERIFIED account blocks signup. Any leftover unverified user from an
    // older flow is cleared so the person can register cleanly.
    const existing = await User.findOne({ email: lowerEmail });
    if (existing) {
      if (existing.isEmailVerified) {
        return conflict("An account with this email already exists");
      }
      await User.deleteOne({ _id: existing._id });
    }

    // Hash the password now; it's carried on the pending record and copied to the
    // real user verbatim on verification (so it is never stored in plain text).
    const passwordHash = await bcrypt.hash(password, 12);

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiry = new Date(Date.now() + OTP_TTL_MS);

    // Upsert — re-registering before verifying just refreshes the code/details,
    // it does NOT error with "already exists".
    await PendingSignup.findOneAndUpdate(
      { email: lowerEmail },
      {
        name,
        email: lowerEmail,
        passwordHash,
        phone: phone || undefined,
        otp: otpHash,
        otpExpiry,
        attempts: 0,
        createdAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send OTP email — BLOCKING so a delivery failure surfaces as a real error.
    try {
      await sendEmail({
        to: lowerEmail,
        subject: `${otp} is your SunEra verification code`,
        html: verifyOtpTemplate(name, otp),
      });
    } catch (err) {
      console.error("[Email] Failed to send verification OTP:", err);
      // No code delivered → discard the pending record so nothing lingers.
      await PendingSignup.deleteOne({ email: lowerEmail });
      return serverError(
        "We couldn't send your verification code right now. Please try again in a moment."
      );
    }

    return ok(
      { email: lowerEmail },
      "We've sent a 6-digit verification code to your email."
    );
  } catch (err) {
    return handleApiError(err);
  }
}
