import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your SunEra Lifestyle account",
};

export default function LoginPage() {
  return (
    <AuthLayout variant="login">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
