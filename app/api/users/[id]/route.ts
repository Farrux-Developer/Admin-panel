import type { NextRequest } from "next/server";
import { userPatchSchema } from "@/lib/schemas";
import { apiError, requireAuth } from "@/lib/server/auth";
import { db, logActivity, toPublicUser } from "@/lib/server/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req, "admin");
  if ("error" in auth) return apiError(auth.error);

  const { id } = await ctx.params;
  const user = db().users.find((u) => u.id === id);
  if (!user) return Response.json({ error: "Не найден" }, { status: 404 });

  const parsed = userPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Некорректные данные" }, { status: 400 });
  }
  if (user.id === auth.user.id && (parsed.data.role === "user" || parsed.data.status === "blocked")) {
    return Response.json({ error: "Нельзя понизить или заблокировать себя" }, { status: 400 });
  }

  Object.assign(user, parsed.data);
  logActivity(auth.user.name, "изменил пользователя", user.name);
  return Response.json({ user: toPublicUser(user) });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req, "admin");
  if ("error" in auth) return apiError(auth.error);

  const { id } = await ctx.params;
  if (id === auth.user.id) {
    return Response.json({ error: "Нельзя удалить себя" }, { status: 400 });
  }
  const list = db().users;
  const i = list.findIndex((u) => u.id === id);
  if (i === -1) return Response.json({ error: "Не найден" }, { status: 404 });

  const [removed] = list.splice(i, 1);
  logActivity(auth.user.name, "удалил пользователя", removed.name);
  return Response.json({ ok: true });
}
