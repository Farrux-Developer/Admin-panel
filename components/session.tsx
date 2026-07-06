"use client";

import { useEffect, type ReactNode } from "react";
import { setAccessToken } from "@/lib/client/api";
import { useAuth } from "@/lib/client/stores";
import type { PublicUser } from "@/lib/types";

/**
 * Bootstraps the client session: seeds the store with the server-verified
 * user and exchanges the httpOnly refresh cookie for an access token.
 */
export function SessionBoot({
  initialUser,
  children,
}: {
  initialUser: PublicUser;
  children: ReactNode;
}) {
  const setUser = useAuth((s) => s.setUser);

  useEffect(() => {
    setUser(initialUser);
    void (async () => {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) {
        window.location.href = "/";
        return;
      }
      const data = (await res.json()) as { accessToken: string; user: PublicUser };
      setAccessToken(data.accessToken);
      setUser(data.user);
    })();
  }, [initialUser, setUser]);

  return <>{children}</>;
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  setAccessToken(null);
  window.location.href = "/";
}
