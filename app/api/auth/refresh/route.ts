import { cookies } from "next/headers";
import { db, toPublicUser } from "@/lib/server/db";
import {
  REFRESH_COOKIE,
  setRefreshCookie,
  signAccess,
  verifyToken,
} from "@/lib/server/auth";

export async function POST() {
  const store = await cookies();
  const token = store.get(REFRESH_COOKIE)?.value;
  if (!token) return Response.json({ error: "Нет сессии" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return Response.json({ error: "Сессия истекла" }, { status: 401 });

  const user = db().users.find((u) => u.id === payload.sub);
  if (!user || user.status === "blocked") {
    return Response.json({ error: "Нет доступа" }, { status: 401 });
  }

  // Rotate the refresh token, re-read role in case it changed.
  const fresh = { sub: user.id, role: user.role, email: user.email };
  await setRefreshCookie(fresh);

  return Response.json({
    user: toPublicUser(user),
    accessToken: await signAccess(fresh),
  });
}
