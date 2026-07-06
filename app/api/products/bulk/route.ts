import { z } from "zod";
import type { NextRequest } from "next/server";
import { apiError, requireAuth } from "@/lib/server/auth";
import { db, logActivity } from "@/lib/server/db";

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(["delete", "hide", "activate"]),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, "admin");
  if ("error" in auth) return apiError(auth.error);

  const parsed = bulkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const { ids, action } = parsed.data;
  const set = new Set(ids);
  const store = db();

  if (action === "delete") {
    store.products = store.products.filter((p) => !set.has(p.id));
  } else {
    const status = action === "hide" ? "hidden" : "active";
    for (const p of store.products) if (set.has(p.id)) p.status = status;
  }

  const verb =
    action === "delete" ? "удалил" : action === "hide" ? "скрыл" : "активировал";
  logActivity(auth.user.name, `${verb} продукты (${ids.length})`, "массово");
  return Response.json({ ok: true });
}
