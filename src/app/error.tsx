"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center px-4">
      <div className="space-y-2">
        <p className="text-8xl font-bold text-muted-foreground/30">500</p>
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md">
          An unexpected error occurred. Our team has been notified.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-brand-black text-brand-white px-8 py-3 text-sm font-semibold transition hover:opacity-80"
        >
          Try Again
        </button>
        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-3 text-sm font-semibold transition hover:bg-muted"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
