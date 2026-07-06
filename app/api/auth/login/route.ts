import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { loginSchema } from "@/lib/schemas";
import { db, logActivity, toPublicUser } from "@/lib/server/db";
import { setRefreshCookie, signAccess } from "@/lib/server/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const user = db().users.find(
    (u) => u.email.toLowerCase() === parsed.data.email.toLowerCase(),
  );
  if (!user || !bcrypt.compareSync(parsed.data.password, user.passwordHash)) {
    return Response.json({ error: "Неверный email или пароль" }, { status: 401 });
  }
  if (user.status === "blocked") {
    return Response.json({ error: "Аккаунт заблокирован" }, { status: 403 });
  }

  user.lastActiveAt = new Date().toISOString();
  const payload = { sub: user.id, role: user.role, email: user.email };
  await setRefreshCookie(payload);
  logActivity(user.name, "вошёл в систему", "—");

  return Response.json({
    user: toPublicUser(user),
    accessToken: await signAccess(payload),
  });
}
