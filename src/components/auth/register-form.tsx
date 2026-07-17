"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/validators/auth.validator";
import { Input } from "@/components/ui/input";
import { PasswordInput, PasswordStrengthBar } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/constants";

export function RegisterForm() {
  const { success, error: toastError } = useToast();
  const [serverError, setServerError] = useState("");
  const [registered, setRegistered] = useState(false);

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

      setRegistered(true);
      success(json.message ?? "Account created! Check your email.");
    } catch {
      setServerError("Network error. Please check your connection.");
    }
  }

  if (registered) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-emerald/10 text-4xl">
          📧
        </div>
        <div>
          <h2 className="text-2xl font-black">Check your email</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            We sent a verification link to your email address. Please click it to activate your account.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive it?{" "}
          <button
            onClick={() => setRegistered(false)}
            className="font-semibold text-brand-emerald hover:underline"
          >
            Try again
          </button>
        </p>
        <Link href={ROUTES.LOGIN}>
          <Button variant="outline" className="w-full rounded-xl">
            Back to Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Join 50,000+ athletes. Sign up in seconds.
        </p>
      </div>

      {serverError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="Rohit Sharma"
          autoComplete="name"
          error={errors.name?.message}
          required
          {...register("name")}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          required
          {...register("email")}
        />

        <Input
          label="Mobile Number"
          type="tel"
          placeholder="9876543210"
          autoComplete="tel"
          hint="Indian mobile numbers only (10 digits)"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <div>
          <PasswordInput
            label="Password"
            placeholder="Create a strong password"
            autoComplete="new-password"
            error={errors.password?.message}
            required
            {...register("password")}
          />
          <PasswordStrengthBar password={passwordValue} />
        </div>

        <PasswordInput
          label="Confirm Password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          required
          {...register("confirmPassword")}
        />

        <div className="flex items-start gap-2 pt-1">
          <input
            id="terms"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 rounded border-border text-brand-emerald focus:ring-brand-emerald cursor-pointer"
          />
          <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            I agree to the{" "}
            <Link href={ROUTES.TERMS} className="font-semibold text-brand-emerald hover:underline" target="_blank">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link href={ROUTES.PRIVACY_POLICY} className="font-semibold text-brand-emerald hover:underline" target="_blank">
              Privacy Policy
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          className="w-full rounded-xl"
        >
          Create Account
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full rounded-xl gap-3"
        onClick={() => toastError("Google sign-in coming soon!")}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={ROUTES.LOGIN} className="font-semibold text-brand-emerald hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
