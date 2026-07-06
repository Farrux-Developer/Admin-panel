import type { NextRequest } from "next/server";
import { apiError, requireAuth } from "@/lib/server/auth";
import { db, toPublicUser } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return apiError(auth.error);

  const products = db().products;
  const resolve = (ids: string[]) =>
    ids
      .map((id) => products.find((p) => p.id === id))
      .filter((p) => p !== undefined && p.status === "active");

  return Response.json({
    user: toPublicUser(auth.user),
    favorites: resolve(auth.user.favorites),
    history: resolve(auth.user.history),
  });
}
