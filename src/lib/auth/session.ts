import { verifyAccessToken } from "./jwt";
import { getAccessToken } from "./cookies";
import type { AuthSession } from "@/types/auth.types";
import { USER_ROLES } from "@/constants";

export async function getServerSession(): Promise<AuthSession> {
  const token = await getAccessToken();

  if (!token) {
    return { user: null, accessToken: null, isAuthenticated: false, isAdmin: false };
  }

  const payload = await verifyAccessToken(token);

  if (!payload) {
    return { user: null, accessToken: null, isAuthenticated: false, isAdmin: false };
  }

  return {
    user: {
      _id: payload.userId,
      email: payload.email,
      role: payload.role,
      name: "",
      isEmailVerified: true,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    accessToken: token,
    isAuthenticated: true,
    isAdmin: payload.role === USER_ROLES.ADMIN,
  };
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getServerSession();
  if (!session.isAuthenticated) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireAdmin(): Promise<AuthSession> {
  const session = await getServerSession();
  if (!session.isAuthenticated || !session.isAdmin) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
