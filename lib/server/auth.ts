import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { db, type UserRecord } from "@/lib/server/db";
import type { Role } from "@/lib/types";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "foundry-dev-secret-change-in-production",
);

export const REFRESH_COOKIE = "fdry_rt";
const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";

export interface TokenPayload {
  sub: string;
  role: Role;
  email: string;
}

async function sign(payload: TokenPayload, ttl: string) {
  return new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(SECRET);
}

export const signAccess = (p: TokenPayload) => sign(p, ACCESS_TTL);
export const signRefresh = (p: TokenPayload) => sign(p, REFRESH_TTL);

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      role: payload.role as Role,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function setRefreshCookie(payload: TokenPayload) {
  const store = await cookies();
  store.set(REFRESH_COOKIE, await signRefresh(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 3600,
    path: "/",
  });
}

export async function clearRefreshCookie() {
  const store = await cookies();
  store.delete(REFRESH_COOKIE);
}

/** Reads the refresh cookie server-side (layout guards). */
export async function getSessionUser(): Promise<UserRecord | null> {
  const store = await cookies();
  const token = store.get(REFRESH_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = db().users.find((u) => u.id === payload.sub);
  if (!user || user.status === "blocked") return null;
  return user;
}

/**
 * Verifies the Bearer access token on API routes.
 * Returns the user record, or a status code to respond with.
 */
export async function requireAuth(
  req: NextRequest,
  role?: Role,
): Promise<{ user: UserRecord } | { error: number }> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return { error: 401 };
  const payload = await verifyToken(token);
  if (!payload) return { error: 401 };
  const user = db().users.find((u) => u.id === payload.sub);
  if (!user || user.status === "blocked") return { error: 401 };
  if (role && user.role !== role) return { error: 403 };
  user.lastActiveAt = new Date().toISOString();
  return { user };
}

export const apiError = (status: number) =>
  Response.json(
    { error: status === 401 ? "Не авторизован" : status === 403 ? "Нет доступа" : "Ошибка" },
    { status },
  );
