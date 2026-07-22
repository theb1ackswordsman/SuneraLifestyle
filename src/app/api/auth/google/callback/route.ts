import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export async function GET(req: NextRequest) {
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { searchParams } = new URL(req.url);
  const code         = searchParams.get("code");
  const state        = searchParams.get("state");
  const errorParam   = searchParams.get("error");

  // User cancelled at Google consent screen
  if (errorParam) {
    return NextResponse.redirect(`${appUrl}/login?error=google_cancelled`);
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const savedState  = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete("google_oauth_state");

  if (!state || state !== savedState) {
    return NextResponse.redirect(`${appUrl}/login?error=google_invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=google_no_code`);
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/login?error=google_not_configured`);
  }

  // Exchange auth code for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      code,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  `${appUrl}/api/auth/google/callback`,
      grant_type:    "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/login?error=google_token_failed`);
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // Fetch user profile from Google
  const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!infoRes.ok) {
    return NextResponse.redirect(`${appUrl}/login?error=google_userinfo_failed`);
  }

  const googleUser = (await infoRes.json()) as GoogleUserInfo;

  await connectDB();

  // Find existing user by googleId or email
  let user = await User.findOne({
    $or: [
      { googleId: googleUser.id },
      { email: googleUser.email.toLowerCase() },
    ],
  }).select("+refreshTokens");

  if (user) {
    // Link Google account if signing in via email match
    if (!user.googleId) user.googleId = googleUser.id;
    // Sync avatar from Google if not set
    if (!user.avatar && googleUser.picture) user.avatar = googleUser.picture;
    // Google-verified email counts as verified
    user.isEmailVerified = true;
    user.lastLoginAt     = new Date();
  } else {
    // New user — create from Google profile
    user = new User({
      name:            googleUser.name,
      email:           googleUser.email.toLowerCase(),
      googleId:        googleUser.id,
      avatar:          googleUser.picture,
      isEmailVerified: true,
      role:            "customer",
    });
  }

  const tokenPayload = {
    userId: user._id.toString(),
    email:  user.email,
    role:   user.role,
  };

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(tokenPayload),
    signRefreshToken(tokenPayload),
  ]);

  // Rotate refresh tokens (keep max 5)
  const tokens = user.refreshTokens ?? [];
  tokens.push(refreshToken);
  if (tokens.length > 5) tokens.splice(0, tokens.length - 5);
  user.refreshTokens = tokens;

  await user.save();
  await setAuthCookies(accessToken, refreshToken);

  // Redirect: admin → /admin, users → /account
  const destination = user.role === "admin" ? "/admin" : "/account";
  return NextResponse.redirect(`${appUrl}${destination}`);
}
