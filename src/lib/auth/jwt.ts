import { SignJWT, jwtVerify } from "jose";
import type { AuthTokenPayload } from "@/types/auth.types";

const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET ?? "fallback-dev-secret-min-32-chars!!!");
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET ?? "fallback-dev-refresh-secret-32c!!");

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

function parseDuration(duration: string): number {
  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);
  const map: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (map[unit] ?? 60);
}

export async function signAccessToken(payload: Omit<AuthTokenPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${parseDuration(ACCESS_EXPIRES)}s`)
    .setIssuer("sunera")
    .setAudience("sunera-client")
    .sign(accessSecret);
}

export async function signRefreshToken(
  payload: Omit<AuthTokenPayload, "iat" | "exp">,
  expiresIn?: string
): Promise<string> {
  const duration = expiresIn ?? REFRESH_EXPIRES;
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${parseDuration(duration)}s`)
    .setIssuer("sunera")
    .setAudience("sunera-refresh")
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret, {
      issuer: "sunera",
      audience: "sunera-client",
    });
    return payload as unknown as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret, {
      issuer: "sunera",
      audience: "sunera-refresh",
    });
    return payload as unknown as AuthTokenPayload;
  } catch {
    return null;
  }
}

const adminPendingSecret = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? "fallback-dev-secret-min-32-chars!!!"
);

export async function signAdminPendingToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email, _pending: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("300s") // 5 min
    .setIssuer("sunera")
    .setAudience("sunera-admin-pending")
    .sign(adminPendingSecret);
}

export async function verifyAdminPendingToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, adminPendingSecret, {
      issuer: "sunera",
      audience: "sunera-admin-pending",
    });
    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export async function signTokenPair(payload: Omit<AuthTokenPayload, "iat" | "exp">) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload),
  ]);
  return { accessToken, refreshToken };
}
