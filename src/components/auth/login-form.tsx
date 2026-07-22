"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/validators/auth.validator";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/constants";
import { ShieldCheck, KeyRound, AlertTriangle, Clock } from "lucide-react";

/* ── Lockout constants ── */
const MAX_ATTEMPTS = 5;
const LOCK_MS      = 2 * 60 * 1000; // 2 minutes
const LS_ATTEMPTS  = "sunera_login_attempts";
const LS_LOCKED    = "sunera_login_locked_until";

function getLockState() {
  if (typeof window === "undefined") return { attempts: 0, lockedUntil: 0 };
  return {
    attempts:    parseInt(localStorage.getItem(LS_ATTEMPTS) ?? "0", 10),
    lockedUntil: parseInt(localStorage.getItem(LS_LOCKED)   ?? "0", 10),
  };
}

function formatCountdown(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const GoogleIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const GOOGLE_ERRORS: Record<string, string> = {
  google_not_configured: "Google sign-in is not set up yet.",
  google_cancelled:      "Google sign-in was cancelled.",
  google_invalid_state:  "Invalid state — please try again.",
  google_token_failed:   "Google sign-in failed. Please try again.",
  google_userinfo_failed:"Could not retrieve your Google profile.",
};

export function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? ROUTES.ACCOUNT;
  const { success, error: toastError } = useToast();

  // Show Google OAuth errors passed as ?error= query param
  useEffect(() => {
    const err = searchParams.get("error");
    if (err && GOOGLE_ERRORS[err]) toastError(GOOGLE_ERRORS[err]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Admin flow state ── */
  const [adminDetected, setAdminDetected] = useState(false);
  const [pendingToken,  setPendingToken]  = useState("");
  const [adminCode,     setAdminCode]     = useState("");

  /* ── Error ── */
  const [serverError, setServerError] = useState("");

  /* ── Lockout ── */
  const [attempts,    setAttempts]    = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [remaining,   setRemaining]   = useState(0);

  useEffect(() => {
    const s = getLockState();
    setAttempts(s.attempts);
    setLockedUntil(s.lockedUntil);
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const left = lockedUntil - Date.now();
      if (left <= 0) {
        setLockedUntil(0); setAttempts(0); setRemaining(0);
        localStorage.removeItem(LS_LOCKED);
        localStorage.removeItem(LS_ATTEMPTS);
      } else {
        setRemaining(left);
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const isLocked = lockedUntil > Date.now();

  const recordFailure = useCallback(() => {
    const next = attempts + 1;
    setAttempts(next);
    localStorage.setItem(LS_ATTEMPTS, String(next));
    if (next >= MAX_ATTEMPTS) {
      const until = Date.now() + LOCK_MS;
      setLockedUntil(until);
      localStorage.setItem(LS_LOCKED, String(until));
    }
  }, [attempts]);

  const clearLock = useCallback(() => {
    setAttempts(0); setLockedUntil(0); setRemaining(0);
    localStorage.removeItem(LS_ATTEMPTS);
    localStorage.removeItem(LS_LOCKED);
  }, []);

  /* ── Form (step 1) ── */
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  /* ── Step 1: email + password ── */
  async function onSubmit(data: LoginInput) {
    if (isLocked) return;
    setServerError("");
    try {
      const res  = await fetch(ROUTES.API.AUTH.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        recordFailure();
        setServerError(json.error ?? "Login failed. Please try again.");
        return;
      }

      // Admin detected — show portal code field
      if (json.data?.step === "admin-code") {
        setPendingToken(json.data.pendingToken);
        setAdminDetected(true);
        return;
      }

      // Regular user — done
      clearLock();
      success(json.message ?? "Welcome back!");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setServerError("Network error. Please check your connection.");
    }
  }

  /* ── Step 2: admin portal code ── */
  async function handleAdminCode(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    setServerError("");
    try {
      const res  = await fetch("/api/auth/admin-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, adminCode }),
      });
      const json = await res.json();

      if (!res.ok) {
        recordFailure();
        setAdminCode("");
        // Reset to step 1 so all 3 creds must be re-entered
        setAdminDetected(false);
        setPendingToken("");
        setServerError(json.error ?? "Invalid portal code. Please sign in again.");
        return;
      }

      clearLock();
      success("Welcome to the Admin Portal.");
      router.push("/admin");
      router.refresh();
    } catch {
      setServerError("Network error. Please check your connection.");
    }
  }

  const attemptsLeft = MAX_ATTEMPTS - attempts;

  return (
    <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
      {/* Heading */}
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Sign in with your email or continue with Google.
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

      {/* Lockout banner */}
      {isLocked && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <Clock className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
          <p className="text-sm text-destructive font-medium">
            Too many failed attempts. Try again in{" "}
            <span className="font-mono font-bold">{formatCountdown(remaining)}</span>.
          </p>
        </div>
      )}

      {/* Attempts warning */}
      {!isLocked && attempts > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs font-semibold text-amber-700">
            {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining before 2-minute lockout
          </p>
        </div>
      )}

      {/* Server error */}
      {serverError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* ── Step 1: Email + Password ── */}
      {!adminDetected && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">Email</p>
            <Input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              required
              disabled={isLocked}
              {...register("email")}
            />
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">Password</p>
            <PasswordInput
              placeholder="Enter your password"
              autoComplete="current-password"
              error={errors.password?.message}
              required
              disabled={isLocked}
              {...register("password")}
            />
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border accent-brand-emerald cursor-pointer"
                {...register("rememberMe")}
              />
              Remember me
            </label>
            <Link href={ROUTES.FORGOT_PASSWORD} className="text-sm font-medium text-foreground hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLocked}
            className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#0f0f0f] px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f0f0f] disabled:opacity-50"
          >
            {isSubmitting ? "Signing in…" : "Sign in →"}
          </button>
        </form>
      )}

      {/* ── Step 2: Admin Portal Code (revealed after admin detected) ── */}
      {adminDetected && (
        <form onSubmit={handleAdminCode} noValidate className="space-y-4">
          {/* Detection badge */}
          <div className="flex items-start gap-3 rounded-xl border border-brand-emerald/25 bg-brand-emerald/8 px-4 py-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-brand-emerald mt-0.5" />
            <div>
              <p className="text-sm font-bold text-brand-emerald">Admin Account Detected</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enter your Admin Portal Code to complete sign-in.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
              Admin Portal Code
            </p>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Enter portal code"
                required
                autoFocus
                disabled={isLocked}
                className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 tracking-widest"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              This is a separate security code, not your password.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setAdminDetected(false); setPendingToken(""); setAdminCode(""); setServerError(""); }}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLocked}
              className="flex-1 rounded-xl bg-[#0f0f0f] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Access Portal →
            </button>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.REGISTER} className="font-semibold text-brand-emerald hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
