import type { NextRequest } from "next/server";
import { apiError, requireAuth } from "@/lib/server/auth";
import { db, logActivity } from "@/lib/server/db";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if ("error" in auth) return apiError(auth.error);

  const { id } = await ctx.params;
  const product = db().products.find((p) => p.id === id);
  if (!product) return Response.json({ error: "Не найден" }, { status: 404 });

  const favs = auth.user.favorites;
  const i = favs.indexOf(id);
  const added = i === -1;
  if (added) {
    favs.unshift(id);
    logActivity(auth.user.name, "добавил в избранное", product.name);
  } else {
    favs.splice(i, 1);
  }
  return Response.json({ favorite: added });
}
