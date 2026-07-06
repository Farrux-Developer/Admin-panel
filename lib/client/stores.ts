"use client";

import { create } from "zustand";
import type { PublicUser } from "@/lib/types";

/* ------------------------------- auth ------------------------------- */

interface AuthState {
  user: PublicUser | null;
  ready: boolean;
  setUser: (user: PublicUser | null) => void;
  setReady: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user, ready: true }),
  setReady: () => set({ ready: true }),
}));

/* ------------------------------ toasts ------------------------------ */

export type ToastKind = "ok" | "error" | "info";

export interface Toast {
  id: number;
  title: string;
  detail?: string;
  kind: ToastKind;
}

interface ToastState {
  toasts: Toast[];
  push: (title: string, kind?: ToastKind, detail?: string) => void;
  dismiss: (id: number) => void;
}

let toastId = 0;

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (title, kind = "info", detail) => {
    const id = ++toastId;
    set({ toasts: [...get().toasts, { id, title, detail, kind }] });
    setTimeout(() => get().dismiss(id), 4200);
  },
  dismiss: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
