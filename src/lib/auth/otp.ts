import crypto from "crypto";
import type { IUserDocument } from "@/models/user.model";

/** How long an email OTP stays valid. */
export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
/** Max wrong attempts before the code is burned and a new one must be requested. */
export const OTP_MAX_ATTEMPTS = 5;

/** A fresh 6-digit numeric code, zero-padded (e.g. "042317"). */
export function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * Stamps a fresh OTP on the user document (does NOT save) and returns the
 * raw code so the caller can email it. Resets the attempt counter.
 */
export function assignEmailOtp(user: IUserDocument): string {
  const otp = generateOtp();
  user.emailOtp = hashOtp(otp);
  user.emailOtpExpiry = new Date(Date.now() + OTP_TTL_MS);
  user.emailOtpAttempts = 0;
  return otp;
}
