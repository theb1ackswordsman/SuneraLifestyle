"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";

type Status = "loading" | "success" | "error" | "already-verified";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const calledRef = useRef(false);

  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resentOk, setResentOk] = useState(false);
  const [resendError, setResendError] = useState("");

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    setResendError("");
    setResentOk(false);
    try {
      const res = await fetch(ROUTES.API.AUTH.VERIFY_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (res.ok) {
        setResentOk(true);
      } else {
        setResendError(json.error ?? "Failed to resend. Please try again.");
      }
    } catch {
      setResendError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  }

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link.");
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    async function verify() {
      try {
        const res = await fetch(`${ROUTES.API.AUTH.VERIFY_EMAIL}?token=${token}`);
        const json = await res.json();

        if (res.ok) {
          if (json.data?.alreadyVerified) {
            setStatus("already-verified");
            setMessage("Your email is already verified.");
          } else {
            setStatus("success");
            setMessage(json.message ?? "Email verified successfully!");
          }
        } else {
          setStatus("error");
          setMessage(json.error ?? "Verification failed. The link may have expired.");
        }
      } catch {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="space-y-6 text-center">
      <motion.div
        key={status}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
        style={{
          background:
            status === "loading"
              ? "rgba(5,150,105,0.1)"
              : status === "success" || status === "already-verified"
              ? "rgba(5,150,105,0.1)"
              : "rgba(239,68,68,0.1)",
        }}
      >
        {status === "loading" && <Loader2 className="h-10 w-10 text-brand-emerald animate-spin" />}
        {(status === "success" || status === "already-verified") && (
          <CheckCircle2 className="h-10 w-10 text-brand-emerald" />
        )}
        {status === "error" && <XCircle className="h-10 w-10 text-destructive" />}
      </motion.div>

      <div>
        <h1 className="text-3xl font-black tracking-tight">
          {status === "loading" && "Verifying…"}
          {status === "success" && "Email Verified!"}
          {status === "already-verified" && "Already Verified"}
          {status === "error" && "Verification Failed"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{message}</p>
      </div>

      {status === "success" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your account is now active. Sign in to start shopping.
          </p>
          <Link href={ROUTES.LOGIN}>
            <Button variant="primary" size="lg" className="w-full rounded-xl">
              Sign In Now
            </Button>
          </Link>
        </div>
      )}

      {status === "already-verified" && (
        <Link href={ROUTES.LOGIN}>
          <Button variant="primary" size="lg" className="w-full rounded-xl">
            Sign In
          </Button>
        </Link>
      )}

      {status === "error" && (
        <div className="space-y-4 w-full max-w-xs mx-auto">
          {resentOk ? (
            <div className="rounded-xl border border-brand-emerald/30 bg-brand-emerald/8 px-4 py-3 text-sm font-medium text-brand-emerald-dark">
              Verification email sent! Check your inbox and spam folder.
            </div>
          ) : (
            <form onSubmit={handleResend} className="space-y-3">
              <p className="text-sm text-muted-foreground">Enter your email to get a new verification link:</p>
              <Input
                type="email"
                placeholder="you@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                error={resendError}
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full rounded-xl"
                disabled={resending}
              >
                {resending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                ) : "Resend Verification Email"}
              </Button>
            </form>
          )}
          <Link href={ROUTES.LOGIN}>
            <Button variant="outline" size="lg" className="w-full rounded-xl">
              Back to Sign In
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <VerifyEmailContent />
    </AuthLayout>
  );
}
