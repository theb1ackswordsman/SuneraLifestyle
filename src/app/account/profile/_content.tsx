"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Settings, Loader2, CheckCircle2, AlertCircle,
  User, Phone, Mail, Camera, Trash2,
} from "lucide-react";

export default function ProfileContent() {
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");
  const [name,       setName]       = useState("");
  const [phone,      setPhone]      = useState("");
  const [avatar,     setAvatar]     = useState("");
  const [email,      setEmail]      = useState("");
  const [uploading,  setUploading]  = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/user/profile");
      const json = await res.json();
      if (res.ok && json.data) {
        setName(json.data.name ?? "");
        setPhone(json.data.phone ?? "");
        setAvatar(json.data.avatar ?? "");
        setEmail(json.data.email ?? "");
      } else {
        setError("Could not load profile. Please refresh.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 256;
          const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
          const w = Math.round(img.width  * ratio);
          const h = Math.round(img.height * ratio);
          const canvas = document.createElement("canvas");
          canvas.width  = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Canvas not supported")); return; }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = () => reject(new Error("Invalid image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(file);
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, WebP, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setAvatar(compressed);
    } catch {
      setError("Could not process image. Try a different file.");
    } finally {
      setUploading(false);
      // Reset so the same file can be re-selected
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!name.trim()) { setError("Full name is required."); return; }
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number."); return;
    }
    setSubmitting(true);
    try {
      const res  = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), avatar }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Update failed."); return; }
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-padded pt-32 pb-16">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Account
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <Settings className="h-5 w-5 text-gray-600" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Profile Settings</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6">

            {/* Profile picture upload */}
            <div className="flex flex-col items-center gap-4 mb-8 pb-8 border-b border-border">
              <div className="relative group">
                {/* Avatar circle */}
                <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border bg-[#1a5c14]/10 flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-[#1a5c14]" />
                  ) : avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt={name}
                      className="h-full w-full object-cover"
                      onError={() => setAvatar("")}
                    />
                  ) : (
                    <User className="h-10 w-10 text-[#1a5c14]" />
                  )}
                </div>

                {/* Camera overlay on hover */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                  title="Change photo"
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
                >
                  <Camera className="h-4 w-4" />
                  {avatar ? "Change Photo" : "Upload Photo"}
                </button>

                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar("")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-100 transition-colors"
                    title="Remove photo"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                JPG, PNG or WebP · Max 5 MB
              </p>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {success && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-[#1a5c14]">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
              </div>
            )}
            {error && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Name */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
                  Full Name <span className="text-red-400">*</span>
                </p>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text" value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name" required
                    className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
                  Email Address
                </p>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email" value={email} readOnly
                    className="flex h-11 w-full rounded-xl border border-input bg-muted/50 pl-10 pr-4 text-sm text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Email address cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
                  Phone Number
                </p>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit Indian mobile number" maxLength={10}
                    className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Format: 10-digit Indian mobile number (e.g. 9876543210)
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f0f0f] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {submitting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : "Save Changes"
                  }
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
