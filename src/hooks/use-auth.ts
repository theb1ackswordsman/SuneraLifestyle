"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

// Module-level cache so every component shares one fetch per page load
let _cache: SessionUser | null | "loading" = "loading";
let _listeners: Array<(u: SessionUser | null) => void> = [];

function notifyListeners(u: SessionUser | null) {
  _cache = u;
  _listeners.forEach((fn) => fn(u));
}

async function fetchOnce() {
  if (_cache !== "loading") return;
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    const json = await res.json();
    notifyListeners(json.success ? (json.data as SessionUser) : null);
  } catch {
    notifyListeners(null);
  }
}

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null | "loading">(_cache);

  useEffect(() => {
    if (_cache !== "loading") {
      setUser(_cache);
      return;
    }
    _listeners.push(setUser);
    fetchOnce();
    return () => {
      _listeners = _listeners.filter((fn) => fn !== setUser);
    };
  }, []);

  return user === "loading" ? null : user;
}

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuth();

  function requireAuth(action: () => void) {
    if (user) {
      action();
    } else {
      const loginUrl = `/login?callbackUrl=${encodeURIComponent(pathname)}&message=${encodeURIComponent("Please sign in or create an account first.")}`;
      router.push(loginUrl);
    }
  }

  return { user, requireAuth };
}

// Call this after login/logout to invalidate the cache
export function invalidateAuthCache() {
  _cache = "loading";
  _listeners = [];
}
