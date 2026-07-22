"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, Eye, EyeOff, Loader2,
  CheckCircle2, AlertCircle, Mail, Calendar, Chrome, Lock,
} from "lucide-react";

interface ProfileData { name: string; email: string; googleId?: string; createdAt: string; }

function getStrength(pw: string) {
  if (!pw) return { label: "", color: "bg-border", width: "w-0" };
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[a-z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  if (score <= 2) return { label: "Weak",   color: "bg-red-400",   width: "w-1/4" };
  if (score === 3) return { label: "Fair",   color: "bg-amber-400", width: "w-2/4" };
  if (score === 4) return { label: "Good",   color: "bg-blue-400",  width: "w-3/4" };
  return              { label: "Strong", color: "bg-[#1a5c14]", width: "w-full" };
}

export default function SecurityContent() {
  const [profile, setProfile]         = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [pwError,     setPwError]     = useState("");
  const [pwSuccess,   setPwSuccess]   = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      const res  = await fetch("/api/user/profile");
      const json = await res.json();
      if (res.ok) setProfile(json.data);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError(""); setPwSuccess("");
    if (!currentPw || !newPw || !confirmPw) { setPwError("All fields are required."); return; }
    if (newPw.length < 8)  { setPwError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("New passwords do not match."); return; }
    if (currentPw === newPw) { setPwError("New password must differ from the current one."); return; }
    setSubmitting(true);
    try {
      const res  = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const json = await res.json();
      if (!res.ok) { setPwError(json.error ?? "Failed to update password."); return; }
      setPwSuccess("Password updated successfully.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSuccess(""), 4000);
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const strength = getStrength(newPw);

  return (
    <div className="container-padded pt-32 pb-16">
      <div className="max-w-4xl mx-auto">
        <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Account
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <ShieldCheck className="h-5 w-5 text-[#1a5c14]" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Security</h1>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-bold text-foreground">Change Password</h2>
          </div>

          {pwSuccess && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-[#1a5c14]">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {pwSuccess}
            </div>
          )}
          {pwError && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {pwError}
            </div>
          )}

          {profile?.googleId && !profileLoading ? (
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-4">
              <Chrome className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Google account</p>
                <p className="text-xs text-blue-600 mt-0.5">Your account uses Google sign-in — no separate password to manage.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
              {/* Current password */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">Current Password</p>
                <div className="relative">
                  <input type={showCurrent ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="Enter current password" autoComplete="current-password" required
                    className="flex h-11 w-full rounded-xl border border-input bg-background pl-4 pr-12 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">New Password</p>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Minimum 8 characters" autoComplete="new-password" required
                    className="flex h-11 w-full rounded-xl border border-input bg-background pl-4 pr-12 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPw && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <p className={`mt-1 text-xs font-medium ${
                      strength.label === "Strong" ? "text-[#1a5c14]" :
                      strength.label === "Good"   ? "text-blue-500"  :
                      strength.label === "Fair"   ? "text-amber-500" : "text-red-500"
                    }`}>{strength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">Confirm New Password</p>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Re-enter new password" autoComplete="new-password" required
                    className={`flex h-11 w-full rounded-xl border bg-background pl-4 pr-12 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      confirmPw && confirmPw !== newPw ? "border-red-400" : confirmPw && confirmPw === newPw ? "border-[#1a5c14]" : "border-input"
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPw && confirmPw !== newPw && <p className="mt-1 text-xs text-red-500">Passwords do not match</p>}
                {confirmPw && confirmPw === newPw && (
                  <p className="mt-1 text-xs text-[#1a5c14] flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Passwords match
                  </p>
                )}
              </div>

              <button type="submit" disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f0f0f] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : "Update Password"}
              </button>
            </form>
          )}
        </div>

        {/* Account Info */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-bold text-foreground mb-6">Account Info</h2>
          {profileLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : profile ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-xl border border-border bg-muted/20 px-4 py-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55 mb-0.5">Email address</p>
                  <p className="text-sm font-medium text-foreground">{profile.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Email cannot be changed</p>
                </div>
              </div>
              {profile.googleId && (
                <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                  <Chrome className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Connected with Google</p>
                    <p className="text-xs text-blue-600">Sign-in is managed through your Google account.</p>
                  </div>
                </div>
              )}
              {profile.createdAt && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55 mb-0.5">Member since</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Could not load account info.</p>
          )}
        </div>
      </div>
    </div>
  );
}
