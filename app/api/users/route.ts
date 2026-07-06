import type { NextRequest } from "next/server";
import { apiError, requireAuth } from "@/lib/server/auth";
import { db, toPublicUser } from "@/lib/server/db";
import type { PublicUser } from "@/lib/types";

const PAGE_SIZE = 10;
const SORTABLE = new Set(["name", "email", "createdAt", "lastActiveAt", "role", "status"]);

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, "admin");
  if ("error" in auth) return apiError(auth.error);

  const params = req.nextUrl.searchParams;
  const q = params.get("q")?.toLowerCase() ?? "";
  const role = params.get("role");
  const status = params.get("status");
  const sort = SORTABLE.has(params.get("sort") ?? "") ? params.get("sort")! : "createdAt";
  const dir = params.get("dir") === "asc" ? 1 : -1;
  const page = Math.max(1, Number(params.get("page") ?? 1));

  let items = db().users.map(toPublicUser);
  if (q) {
    items = items.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }
  if (role === "user" || role === "admin") items = items.filter((u) => u.role === role);
  if (status === "active" || status === "blocked") {
    items = items.filter((u) => u.status === status);
  }

  items.sort((a, b) => {
    const av = a[sort as keyof PublicUser] ?? "";
    const bv = b[sort as keyof PublicUser] ?? "";
    return String(av).localeCompare(String(bv), "ru") * dir;
  });

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pages);

  return Response.json({
    items: items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    total,
    page: safePage,
    pages,
  });
}
