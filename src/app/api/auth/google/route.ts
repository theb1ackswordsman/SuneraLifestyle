import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const clientId = process.env.GOOGLE_CLIENT_ID;

  // Intent: "signup" (create account allowed) or "login" (must already exist)
  const flow = new URL(req.url).searchParams.get("flow") === "signup" ? "signup" : "login";
  const errorReturn = flow === "signup" ? "/register" : "/login";

  if (!clientId) {
    return NextResponse.redirect(`${appUrl}${errorReturn}?error=google_not_configured`);
  }

  // Generate CSRF state token
  const state       = nanoid(32);
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         "openid email profile",
    state,
    access_type:   "offline",
    prompt:        "select_account",
  });

  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge:   600, // 10 minutes
    path:     "/",
  };
  cookieStore.set("google_oauth_state", state, cookieOpts);
  // Remember whether the user was signing up or logging in
  cookieStore.set("google_oauth_flow", flow, cookieOpts);

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
}
