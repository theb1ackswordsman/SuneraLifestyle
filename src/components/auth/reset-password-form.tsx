"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/validators/auth.validator";
import { PasswordInput, PasswordStrengthBar } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const passwordValue = watch("password") ?? "";

  async function onSubmit(data: ResetPasswordInput) {
    setServerError("");
    try {
      const res = await fetch(ROUTES.API.AUTH.RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Failed to reset password. The link may have expired.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push(ROUTES.LOGIN), 2500);
    } catch {
      setServerError("Network error. Please check your connection.");
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-2xl font-black">Invalid Link</h2>
        <p className="text-sm text-muted-foreground">
          This password reset link is invalid or missing. Please request a new one.
        </p>
        <Link href={ROUTES.FORGOT_PASSWORD}>
          <Button variant="primary" className="w-full rounded-xl">
            Request New Link
          </Button>
        </Link>
      </div>
    );
  }

  if (done) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Reset password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a new strong password for your account.
        </p>
      </div>

      {serverError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
          {serverError.includes("expired") && (
            <span>
              {" "}
              <Link href={ROUTES.FORGOT_PASSWORD} className="font-bold underline">
                Request a new link.
              </Link>
            </span>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <input type="hidden" {...register("token")} />

        <div>
          <PasswordInput
            label="New Password"
            placeholder="Create a strong password"
            autoComplete="new-password"
            error={errors.password?.message}
            required
            {...register("password")}
          />
          <PasswordStrengthBar password={passwordValue} />
        </div>

        <PasswordInput
          label="Confirm New Password"
          placeholder="Repeat your new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          required
          {...register("confirmPassword")}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          className="w-full rounded-xl"
        >
          Reset Password
        </Button>
      </form>
    </div>
  );
}
