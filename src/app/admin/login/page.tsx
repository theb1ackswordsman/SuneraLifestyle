"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, ShieldCheck, Lock, Mail, KeyRound, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "credentials" | "admin-code" | "success";

export default function AdminLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("credentials");
  const [pendingToken, setPendingToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Login failed.");
        return;
      }
      if (json.data?.step === "admin-code") {
        setPendingToken(json.data.pendingToken);
        setStep("admin-code");
      } else {
        setError("This account does not have admin privileges.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, adminCode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Verification failed.");
        return;
      }
      setStep("success");
      setTimeout(() => router.push("/admin"), 1200);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f4f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
            <Image src="/sunera.jpeg" alt="SunEra Lifestyle" width={56} height={56} className="object-contain" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">SunEra Lifestyle</p>
            <h1 className="text-xl font-black text-gray-900">Admin Portal</h1>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">

          {/* Step indicator */}
          <div className="flex border-b border-gray-100">
            {(["credentials", "admin-code"] as const).map((s, i) => (
              <div
                key={s}
                className={cn(
                  "flex-1 py-3 text-center text-xs font-semibold transition-colors",
                  step === s || (step === "success" && i === 1)
                    ? "bg-[#1a5c14] text-white"
                    : step === "admin-code" && i === 0
                    ? "bg-[#1a5c14]/10 text-[#1a5c14]"
                    : "text-gray-400"
                )}
              >
                {i + 1}. {s === "credentials" ? "Credentials" : "Portal Code"}
              </div>
            ))}
          </div>

          <div className="p-8">

            {/* Step 1: Email + Password */}
            {step === "credentials" && (
              <form onSubmit={handleCredentials} className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Sign in</h2>
                  <p className="text-sm text-gray-500 mt-1">Enter your admin email and password.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@sunera.in"
                      required
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1a5c14] hover:bg-[#103a0c] text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking...</> : "Continue"}
                </button>
              </form>
            )}

            {/* Step 2: Admin Code */}
            {step === "admin-code" && (
              <form onSubmit={handleAdminCode} className="space-y-5">
                {/* Detection badge */}
                <div className="flex items-start gap-3 rounded-xl bg-[#1a5c14]/8 border border-[#1a5c14]/20 p-4">
                  <ShieldCheck className="h-6 w-6 shrink-0 text-[#1a5c14] mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#1a5c14]">Admin Account Detected</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Enter the Admin Portal Code to complete verification.
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Admin Portal Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      placeholder="Enter portal code"
                      required
                      autoFocus
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14] tracking-widest"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">This is a separate security code, not your password.</p>
                </div>

                {error && <p className="text-sm font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep("credentials"); setAdminCode(""); setError(""); }}
                    className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#1a5c14] hover:bg-[#103a0c] text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : "Access Portal"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success */}
            {step === "success" && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-[#1a5c14]/10 flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-[#1a5c14]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">Access Granted</p>
                  <p className="text-sm text-gray-500 mt-1">Redirecting to Admin Dashboard...</p>
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-[#1a5c14]" />
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Authorized personnel only · SunEra Lifestyle Admin System
        </p>
      </div>
    </div>
  );
}
