import type { NextRequest } from "next/server";
import { productSchema } from "@/lib/schemas";
import { apiError, requireAuth } from "@/lib/server/auth";
import { db, logActivity } from "@/lib/server/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req);
  if ("error" in auth) return apiError(auth.error);

  const { id } = await ctx.params;
  const product = db().products.find((p) => p.id === id);
  if (!product || (auth.user.role !== "admin" && product.status !== "active")) {
    return Response.json({ error: "Не найден" }, { status: 404 });
  }
  return Response.json({ product, favorite: auth.user.favorites.includes(id) });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req, "admin");
  if ("error" in auth) return apiError(auth.error);

  const { id } = await ctx.params;
  const product = db().products.find((p) => p.id === id);
  if (!product) return Response.json({ error: "Не найден" }, { status: 404 });

  const parsed = productSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Некорректные данные" }, { status: 400 });
  }
  Object.assign(product, parsed.data);
  logActivity(auth.user.name, "обновил продукт", product.name);
  return Response.json({ product });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireAuth(req, "admin");
  if ("error" in auth) return apiError(auth.error);

  const { id } = await ctx.params;
  const list = db().products;
  const i = list.findIndex((p) => p.id === id);
  if (i === -1) return Response.json({ error: "Не найден" }, { status: 404 });

  const [removed] = list.splice(i, 1);
  logActivity(auth.user.name, "удалил продукт", removed.name);
  return Response.json({ ok: true });
}
