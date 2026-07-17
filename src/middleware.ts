import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, verifyRefreshToken, signAccessToken } from "@/lib/auth/jwt";
import { COOKIES, USER_ROLES, ROUTES } from "@/constants";

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
const PROTECTED_PATHS = ["/account", "/checkout", "/wishlist"];

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((path) => pathname.startsWith(path));
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Admin login page is always public
  if (pathname === ROUTES.ADMIN_LOGIN) {
    return addSecurityHeaders(NextResponse.next());
  }

  const accessToken = request.cookies.get(COOKIES.ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIES.REFRESH_TOKEN)?.value;

  let payload = accessToken ? await verifyAccessToken(accessToken) : null;

  // Try refresh if access token expired
  if (!payload && refreshToken) {
    const refreshPayload = await verifyRefreshToken(refreshToken);
    if (refreshPayload) {
      const newAccessToken = await signAccessToken({
        userId: refreshPayload.userId,
        email: refreshPayload.email,
        role: refreshPayload.role,
        adminVerified: refreshPayload.adminVerified,
      });
      const response = NextResponse.next();
      response.cookies.set(COOKIES.ACCESS_TOKEN, newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60,
      });
      payload = refreshPayload;
      return addSecurityHeaders(response);
    }
  }

  const isAuthenticated = !!payload;
  const isAdmin = payload?.role === USER_ROLES.ADMIN;
  const adminVerified = payload?.adminVerified === true;

  // Redirect authenticated users away from auth pages
  if (isAuthPath(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL(ROUTES.ACCOUNT, request.url));
  }

  // Protect account/checkout routes
  if (isProtectedPath(pathname) && !isAuthenticated) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect all /admin/* routes (except /admin/login handled above)
  if (isAdminPath(pathname)) {
    if (!isAuthenticated || !isAdmin || !adminVerified) {
      return NextResponse.redirect(new URL(ROUTES.ADMIN_LOGIN, request.url));
    }
  }

  const response = NextResponse.next();

  if (payload) {
    response.headers.set("x-user-id", payload.userId);
    response.headers.set("x-user-role", payload.role);
    if (payload.adminVerified) {
      response.headers.set("x-admin-verified", "1");
    }
  }

  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icons|fonts|robots.txt|sitemap.xml).*)",
  ],
};
