import type { NextRequest } from "next/server";
import { productSchema } from "@/lib/schemas";
import { apiError, requireAuth } from "@/lib/server/auth";
import { db, logActivity, productArt, uid } from "@/lib/server/db";
import type { Product } from "@/lib/types";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return apiError(auth.error);

  const params = req.nextUrl.searchParams;
  const q = params.get("q")?.toLowerCase() ?? "";
  const category = params.get("category");

  let items = db().products;
  // Regular users only ever see active products.
  if (auth.user.role !== "admin") items = items.filter((p) => p.status === "active");
  if (q) items = items.filter((p) => p.name.toLowerCase().includes(q));
  if (category) items = items.filter((p) => p.category === category);

  return Response.json({
    items: [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    categories: [...new Set(db().products.map((p) => p.category))],
    favorites: auth.user.favorites,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, "admin");
  if ("error" in auth) return apiError(auth.error);

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 },
    );
  }

  const product: Product = {
    id: uid("p"),
    ...parsed.data,
    description: parsed.data.description ?? "",
    image: parsed.data.image || productArt(Math.floor(Math.random() * 10000)),
    views: 0,
    createdAt: new Date().toISOString(),
  };
  db().products.unshift(product);
  logActivity(auth.user.name, "создал продукт", product.name);
  return Response.json({ product }, { status: 201 });
}
