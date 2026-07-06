import type { NextRequest } from "next/server";
import { apiError, requireAuth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if ("error" in auth) return apiError(auth.error);

  const { id } = await ctx.params;
  const product = db().products.find((p) => p.id === id);
  if (!product) return Response.json({ error: "Не найден" }, { status: 404 });

  product.views += 1;
  const history = auth.user.history.filter((h) => h !== id);
  history.unshift(id);
  auth.user.history = history.slice(0, 24);
  return Response.json({ ok: true });
}
