import mongoose, { Document, Model, Schema } from "mongoose";

/**
 * A signup that has NOT yet been verified. Holds the entered details + a hashed
 * OTP until the user confirms the code, at which point a real User is created
 * and this record is deleted. Nothing lands in the `users` collection until then.
 *
 * Records auto-purge after 30 minutes via the TTL index below, so abandoned
 * signups never accumulate.
 */
export interface IPendingSignup extends Document {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  otp: string; // sha256 hash of the 6-digit code
  otpExpiry: Date;
  attempts: number;
  createdAt: Date;
}

const pendingSchema = new Schema<IPendingSignup>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  otp: { type: String, required: true },
  otpExpiry: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Auto-delete stale pending signups 30 minutes after creation.
pendingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

export const PendingSignup: Model<IPendingSignup> =
  mongoose.models.PendingSignup ??
  mongoose.model<IPendingSignup>("PendingSignup", pendingSchema);
