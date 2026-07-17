import { z } from "zod";

const envSchema = z.object({
  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("SunEra Lifestyle"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // MongoDB — optional so the app can build/boot without it (DB features degrade)
  MONGODB_URI: z.string().optional(),

  // JWT (jwt.ts has dev fallbacks; set these in production)
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Cloudinary (image uploads degrade gracefully if unset)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),

  // Email
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("SunEra <no-reply@sunera.in>"),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),

  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Never throw — a missing/invalid var must not crash the build or a fresh
    // deploy. Warn and continue with best-effort defaults; features that need
    // the missing var will fail gracefully at runtime.
    const issues = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    console.warn(`[SunEra] Some environment variables are missing/invalid — running with reduced functionality:\n${issues}`);
    return envSchema.partial().parse(process.env) as Env;
  }
  return parsed.data;
}

// Validate once at module load (server-side only)
export const env = typeof window === "undefined" ? validateEnv() : ({} as Env);
