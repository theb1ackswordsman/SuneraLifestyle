"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch { /* ignore network errors */ }
    router.push("/login?signedOut=true");
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={signingOut}
      className="inline-flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 hover:underline disabled:opacity-60"
    >
      {signingOut ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Signing out…</>
      ) : (
        <><LogOut className="h-4 w-4" /> Sign Out</>
      )}
    </button>
  );
}
