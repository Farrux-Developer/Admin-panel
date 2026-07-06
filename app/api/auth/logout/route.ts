import { clearRefreshCookie } from "@/lib/server/auth";

export async function POST() {
  await clearRefreshCookie();
  return Response.json({ ok: true });
}
