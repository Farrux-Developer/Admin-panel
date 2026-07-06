import type { NextRequest } from "next/server";
import { apiError, requireAuth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, "admin");
  if ("error" in auth) return apiError(auth.error);
  return Response.json({ items: db().activity.slice(0, 30) });
}
