"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/validators/auth.validator";
import { Input } from "@/components/ui/input";
import { PasswordInput, PasswordStrengthBar } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";

/** OTP validity — must mirror OTP_TTL_MS on the server (2 minutes). */
const OTP_WINDOW_MS = 2 * 60 * 1000;

function formatCountdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type NewPasswordInput = z.infer<typeof newPasswordSchema>;

type Step = "email" | "otp" | "password" | "done";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [serverError, setServerError] = useState("");

  /* ── OTP countdown ── */
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);
  const [msLeft, setMsLeft] = useState(0);
  const otpExpired = otpExpiresAt > 0 && msLeft <= 0;
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!otpExpiresAt) return;
    const tick = () => setMsLeft(otpExpiresAt - Date.now());
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [otpExpiresAt]);

  /* ── Step 1: email ── */
  const emailForm = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmitEmail(data: ForgotPasswordInput) {
    setServerError("");
    try {
      const res = await fetch(ROUTES.API.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setEmail(data.email);
      setOtp("");
      setOtpExpiresAt(Date.now() + OTP_WINDOW_MS);
      setStep("otp");
    } catch {
      setServerError("Network error. Please check your connection.");
    }
  }

  /* ── Step 2: verify OTP ── */
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6 || otpExpired) return;
    setVerifying(true);
    setServerError("");
    try {
      const res = await fetch(ROUTES.API.AUTH.FORGOT_PASSWORD_VERIFY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Invalid code. Please try again.");
        return;
      }
      setServerError("");
      setStep("password");
    } catch {
      setServerError("Network error. Please check your connection.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setServerError("");
    try {
      const res = await fetch(ROUTES.API.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Could not resend the code. Please try again.");
        return;
      }
      setOtp("");
      setOtpExpiresAt(Date.now() + OTP_WINDOW_MS);
    } catch {
      setServerError("Network error. Please check your connection.");
    } finally {
      setResending(false);
    }
  }

  /* ── Step 3: new password ── */
  const passwordForm = useForm<NewPasswordInput>({ resolver: zodResolver(newPasswordSchema) });
  const passwordValue = passwordForm.watch("password") ?? "";

  async function onSubmitPassword(data: NewPasswordInput) {
    setServerError("");
    try {
      const res = await fetch(ROUTES.API.AUTH.RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, ...data }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Failed to reset password. The code may have expired.");
        return;
      }
      setStep("done");
      setTimeout(() => router.push(ROUTES.LOGIN), 2500);
    } catch {
      setServerError("Network error. Please check your connection.");
    }
  }

  /* ── Done ── */
  if (step === "done") {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-emerald/10 text-4xl">
          ✅
        </div>
        <div>
          <h2 className="text-2xl font-black">Password Reset!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your password has been updated. Redirecting you to sign in…
          </p>
        </div>
      </div>
    );
  }

  const errorBanner = serverError && (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {serverError}
    </div>
  );

  /* ── Step 2 UI: OTP ── */
  if (step === "otp") {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => { setStep("email"); setServerError(""); }}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Change email
          </button>
          <h1 className="text-3xl font-black tracking-tight">Enter reset code</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-foreground">{email}</span>. Check your inbox
            (and Spam/Promotions).
          </p>
        </div>

        {errorBanner}

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            value={otp}
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setServerError(""); }}
            placeholder="••••••"
            className="h-14 w-full rounded-xl border border-input bg-background text-center text-3xl font-bold tracking-[0.5em] placeholder:tracking-[0.5em] placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          {otpExpired ? (
            <p className="text-sm font-medium text-destructive">
              Your code has expired. Please request a new one below.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Code expires in{" "}
              <span className="font-mono font-semibold text-foreground">{formatCountdown(msLeft)}</span>
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={verifying}
            disabled={otp.length !== 6 || otpExpired}
            className="w-full rounded-xl"
          >
            Verify Code
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          {otpExpired ? "Didn't get a code or it expired?" : "Didn't receive it?"}{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-1.5 font-semibold text-brand-emerald hover:underline disabled:opacity-60"
          >
            {resending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {resending ? "Sending…" : "Resend code"}
          </button>
        </p>
      </div>
    );
  }

  /* ── Step 3 UI: new password ── */
  if (step === "password") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Set a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a new strong password for <span className="font-semibold text-foreground">{email}</span>.
          </p>
        </div>

        {errorBanner}

        <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} noValidate className="space-y-4">
          <div>
            <PasswordInput
              label="New Password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              error={passwordForm.formState.errors.password?.message}
              required
              {...passwordForm.register("password")}
            />
            <PasswordStrengthBar password={passwordValue} />
          </div>

          <PasswordInput
            label="Confirm New Password"
            placeholder="Repeat your new password"
            autoComplete="new-password"
            error={passwordForm.formState.errors.confirmPassword?.message}
            required
            {...passwordForm.register("confirmPassword")}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={passwordForm.formState.isSubmitting}
            className="w-full rounded-xl"
          >
            Reset Password
          </Button>
        </form>
      </div>
    );
  }

  /* ── Step 1 UI: email ── */
  return (
    <div className="space-y-6">
      <div>
        <Link
          href={ROUTES.LOGIN}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <h1 className="text-3xl font-black tracking-tight">Forgot password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a 6-digit code to reset it.
        </p>
      </div>

      {errorBanner}

      <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} noValidate className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={emailForm.formState.errors.email?.message}
          required
          {...emailForm.register("email")}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={emailForm.formState.isSubmitting}
          className="w-full rounded-xl"
        >
          Send Reset Code
        </Button>
      </form>
    </div>
  );
}
