import { cookies } from "next/headers";
import { COOKIES } from "@/constants";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const ACCESS_TOKEN_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 15 * 60, // 15 minutes
};

const REFRESH_TOKEN_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIES.ACCESS_TOKEN, accessToken, ACCESS_TOKEN_OPTIONS);
  cookieStore.set(COOKIES.REFRESH_TOKEN, refreshToken, REFRESH_TOKEN_OPTIONS);
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIES.ACCESS_TOKEN);
  cookieStore.delete(COOKIES.REFRESH_TOKEN);
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIES.ACCESS_TOKEN)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIES.REFRESH_TOKEN)?.value;
}

export async function setCartCookie(cartId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIES.CART_ID, cartId, {
    httpOnly: false,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function getCartCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIES.CART_ID)?.value;
}
