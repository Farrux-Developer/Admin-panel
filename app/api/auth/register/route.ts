import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { registerSchema } from "@/lib/schemas";
import { db, logActivity, toPublicUser, uid } from "@/lib/server/db";
import { setRefreshCookie, signAccess } from "@/lib/server/auth";
import type { UserRecord } from "@/lib/server/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  if (db().users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return Response.json({ error: "Email уже зарегистрирован" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const user: UserRecord = {
    id: uid("u"),
    email,
    name,
    role: "user",
    status: "active",
    avatar: null,
    createdAt: now,
    lastActiveAt: now,
    favorites: [],
    history: [],
    passwordHash: bcrypt.hashSync(password, 8),
  };
  db().users.push(user);

  const payload = { sub: user.id, role: user.role, email: user.email };
  await setRefreshCookie(payload);
  logActivity(user.name, "зарегистрировался", "—");

  return Response.json(
    { user: toPublicUser(user), accessToken: await signAccess(payload) },
    { status: 201 },
  );
}
