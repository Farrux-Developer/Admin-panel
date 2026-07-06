"use client";

import type { PublicUser } from "@/lib/types";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function tryRefresh(): Promise<boolean> {
  const res = await fetch("/api/auth/refresh", { method: "POST" });
  if (!res.ok) return false;
  const data = (await res.json()) as { accessToken: string };
  accessToken = data.accessToken;
  return true;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Fetch wrapper: attaches the in-memory access token and transparently
 * retries once through the refresh endpoint on 401.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const doFetch = () =>
    fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

  let res = await doFetch();
  if (res.status === 401 && (await tryRefresh())) {
    res = await doFetch();
  }
  if (!res.ok) {
    let message = "Ошибка запроса";
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}
