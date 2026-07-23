"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/validators/auth.validator";
import { Input } from "@/components/ui/input";
import { PasswordInput, PasswordStrengthBar } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/constants";
import { Loader2 } from "lucide-react";

const GoogleIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export function RegisterForm() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [serverError, setServerError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resentOk, setResentOk] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password") ?? "";

  async function onSubmit(data: RegisterInput) {
    setServerError("");
    try {
      const res = await fetch(ROUTES.API.AUTH.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Registration failed. Please try again.");
        return;
      }
      setRegisteredEmail(data.email);
      toastSuccess(json.message ?? "Account created! Check your email.");
    } catch {
      setServerError("Network error. Please check your connection.");
    }
  }

  async function handleResend() {
    setResending(true);
    setResentOk(false);
    try {
      const res = await fetch(ROUTES.API.AUTH.VERIFY_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const json = await res.json();
      if (res.ok) {
        setResentOk(true);
      } else {
        toastError(json.error ?? "Could not resend email. Please try again.");
      }
    } catch {
      toastError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  }

  /* ── Success state ── */
  if (registeredEmail) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 shadow-sm text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-emerald/10 text-3xl">
          📧
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            We sent a verification link to{" "}
            <span className="font-semibold text-foreground">{registeredEmail}</span>.
            Click it to activate your account.
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            If you don&apos;t see it, check your <strong>Spam</strong> or <strong>Promotions</strong> folder.
          </p>
        </div>

        {resentOk ? (
          <div className="rounded-xl border border-brand-emerald/30 bg-brand-emerald/8 px-4 py-3 text-sm font-medium text-brand-emerald-dark">
            Verification email resent! Check your inbox.
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive it?{" "}
            <button
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-1.5 font-semibold text-brand-emerald hover:underline disabled:opacity-60"
            >
              {resending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {resending ? "Sending…" : "Resend verification email"}
            </button>
          </p>
        )}

        <Link
          href={ROUTES.LOGIN}
          className="mt-2 flex w-full items-center justify-center rounded-xl border border-border bg-background py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  /* ── Register form ── */
  return (
    <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
      {/* Heading */}
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Start your wellness journey — it only takes a minute.
      </p>

      {/* Google OAuth */}
      <a
        href="/api/auth/google"
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <GoogleIcon />
        Continue with Google
      </a>

      {/* OR divider */}
      <div className="relative my-6 flex items-center gap-3">
        <div className="flex-1 border-t border-border" />
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          or with email
        </span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* Server error */}
      {serverError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Full Name */}
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
            Full Name
          </p>
          <Input
            type="text"
            placeholder="Priya Sharma"
            autoComplete="name"
            error={errors.name?.message}
            required
            {...register("name")}
          />
        </div>

        {/* Email */}
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
            Email
          </p>
          <Input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            required
            {...register("email")}
          />
        </div>

        {/* Phone */}
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
            Mobile Number <span className="normal-case font-normal tracking-normal">(optional)</span>
          </p>
          <Input
            type="tel"
            placeholder="9876543210"
            autoComplete="tel"
            hint="10-digit Indian mobile number"
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>

        {/* Password */}
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
            Password
          </p>
          <PasswordInput
            placeholder="Create a strong password"
            autoComplete="new-password"
            error={errors.password?.message}
            required
            {...register("password")}
          />
          <PasswordStrengthBar password={passwordValue} />
        </div>

        {/* Confirm Password */}
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
            Confirm Password
          </p>
          <PasswordInput
            placeholder="Repeat your password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            required
            {...register("confirmPassword")}
          />
        </div>

        {/* Terms — registered with react-hook-form so it blocks submission if unchecked */}
        <div className="pt-1">
          <label className="flex cursor-pointer items-start gap-2.5 select-none">
            <input
              id="terms"
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-brand-emerald cursor-pointer"
              {...register("acceptTerms")}
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I agree to the{" "}
              <Link href={ROUTES.TERMS} className="font-semibold text-brand-emerald hover:underline" target="_blank">
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link href={ROUTES.PRIVACY_POLICY} className="font-semibold text-brand-emerald hover:underline" target="_blank">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1.5 text-xs text-destructive">{errors.acceptTerms.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f0f0f] px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f0f0f] disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating account…" : "Create Account →"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={ROUTES.LOGIN} className="font-semibold text-brand-emerald hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
