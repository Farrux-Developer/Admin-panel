import type { NextRequest } from "next/server";
import { profileSchema } from "@/lib/schemas";
import { apiError, requireAuth } from "@/lib/server/auth";
import { logActivity, toPublicUser } from "@/lib/server/db";

const MAX_AVATAR_BYTES = 400_000;

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return apiError(auth.error);

  const parsed = profileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 },
    );
  }

  const { name, avatar } = parsed.data;
  if (avatar && avatar.length > MAX_AVATAR_BYTES) {
    return Response.json({ error: "Аватар слишком большой (до ~300KB)" }, { status: 400 });
  }
  if (avatar && !avatar.startsWith("data:image/")) {
    return Response.json({ error: "Некорректный формат изображения" }, { status: 400 });
  }

  auth.user.name = name;
  if (avatar !== undefined) auth.user.avatar = avatar;
  logActivity(auth.user.name, "обновил профиль", "—");
  return Response.json({ user: toPublicUser(auth.user) });
}
