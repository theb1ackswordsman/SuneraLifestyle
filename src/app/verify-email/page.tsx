"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";

type Status = "loading" | "success" | "error" | "already-verified";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const calledRef = useRef(false);

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
        <div className="space-y-3">
          <Link href={ROUTES.LOGIN}>
            <Button variant="outline" size="lg" className="w-full rounded-xl">
              Back to Sign In
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Need a new link?{" "}
            <Link href={ROUTES.REGISTER} className="font-semibold text-brand-emerald hover:underline">
              Register again
            </Link>
          </p>
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
