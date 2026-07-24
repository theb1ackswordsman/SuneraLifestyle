/**
 * Run: npx tsx scripts/seed-admin.ts   (or: npm run seed:admin)
 *
 * Creates the SunEra admin user in MongoDB.
 * Defaults (override in .env for production):
 *   ADMIN_SEED_EMAIL    (default admin@sunera.in)
 *   ADMIN_SEED_PASSWORD (default SunEra@Admin2024 — CHANGE THIS before deploying)
 *   ADMIN_PORTAL_CODE   (the admin login portal code)
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load .env manually (avoids a hard dotenv dependency)
function loadEnv() {
  try {
    const txt = readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* .env optional if vars already in environment */
  }
}
loadEnv();

// Admin seed credentials — must be set in .env (no hardcoded defaults for production).
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? "admin@sunera.in";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "SunEra@Admin2024";
const ADMIN_PORTAL_CODE = process.env.ADMIN_PORTAL_CODE;

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set in .env");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  email:            { type: String, required: true, unique: true, lowercase: true },
  password:         { type: String, select: false },
  adminPortalCode:  { type: String, select: false },
  role:             { type: String, enum: ["admin", "customer", "moderator"], default: "customer" },
  isEmailVerified:  { type: Boolean, default: false },
  isActive:         { type: Boolean, default: true },
  refreshTokens:    { type: [String], default: [], select: false },
  loginAttempts:    { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.models.User ?? mongoose.model("User", userSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI as string);
  console.log("✅  Connected to MongoDB");

  if (!ADMIN_PORTAL_CODE) {
    console.error("❌  ADMIN_PORTAL_CODE is not set in .env — required to seed admin portal code.");
    console.error("    Add ADMIN_PORTAL_CODE=<your-code> to .env and re-run this script.");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const hashedCode = await bcrypt.hash(ADMIN_PORTAL_CODE, 12);

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log("ℹ️   Admin user already exists — updating credentials.");
    await User.updateOne(
      { email: ADMIN_EMAIL },
      { $set: { role: "admin", isEmailVerified: true, isActive: true, password: hashedPassword, adminPortalCode: hashedCode } }
    );
    console.log("✅  Admin user updated.");
  } else {
    await User.create({
      name: "SunEra Admin",
      email: ADMIN_EMAIL,
      password: hashedPassword,
      adminPortalCode: hashedCode,
      role: "admin",
      isEmailVerified: true,
      isActive: true,
    });
    console.log("✅  Admin user created.");
  }

  console.log("\n🔑  Admin credentials (stored in database — env vars no longer needed at runtime)");
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   Password : ${ADMIN_PASSWORD}`);
  console.log(`   Code     : ${ADMIN_PORTAL_CODE}`);
  console.log("   Portal   : http://localhost:3000/admin/login\n");
  console.log("   ⚠️  These credentials are now in the database. You can remove ADMIN_SEED_EMAIL,");
  console.log("       ADMIN_SEED_PASSWORD, and ADMIN_PORTAL_CODE from .env after this initial seed.\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
