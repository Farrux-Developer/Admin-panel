"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/client/api";
import { useAuth, useToasts } from "@/lib/client/stores";
import { Avatar, Pill, SkeletonBlock } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { PublicUser } from "@/lib/types";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const pushToast = useToasts((s) => s.push);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null | undefined>(undefined);
  const [pending, setPending] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <SkeletonBlock className="h-24 w-24" />
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-10 w-full" />
      </div>
    );
  }

  const currentName = name ?? user.name;
  const currentAvatar = avatar === undefined ? user.avatar : avatar;
  const dirty = currentName !== user.name || currentAvatar !== user.avatar;

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      pushToast("Нужно изображение", "error");
      return;
    }
    if (file.size > 300_000) {
      pushToast("Файл больше 300KB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setPending(true);
    try {
      const res = await api<{ user: PublicUser }>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: currentName, avatar: currentAvatar }),
      });
      setUser(res.user);
      setName(null);
      setAvatar(undefined);
      pushToast("Профиль обновлён", "ok");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка сохранения", "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <p className="microlabel mb-1">08 / Личное дело</p>
      <h1
        className="mb-8 text-2xl font-semibold uppercase"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Профиль
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="border bg-panel"
      >
        <div className="flex items-center gap-5 hairline-b p-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="group relative"
            aria-label="Сменить аватар"
          >
            <Avatar name={currentName} src={currentAvatar} size={88} />
            <span className="microlabel absolute inset-0 flex items-center justify-center bg-black/60 !text-ink opacity-0 transition-opacity group-hover:opacity-100">
              Сменить
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <div>
            <p className="text-lg text-ink">{currentName}</p>
            <p className="font-mono text-xs text-dim">{user.email}</p>
            <div className="mt-2 flex gap-1.5">
              <Pill tone={user.role === "admin" ? "warn" : "dim"}>{user.role}</Pill>
              <Pill tone="ok">c {formatDate(user.createdAt)}</Pill>
            </div>
          </div>
        </div>

        <div className="p-6">
          <label className="block">
            <span className="microlabel mb-2 block">Имя</span>
            <input
              value={currentName}
              onChange={(e) => setName(e.target.value)}
              className="w-full border bg-panel2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>

          {currentAvatar && (
            <button
              onClick={() => setAvatar(null)}
              className="microlabel mt-4 border px-3 py-1.5 transition-colors hover:border-danger hover:!text-danger"
            >
              Убрать аватар
            </button>
          )}

          <motion.button
            onClick={() => void save()}
            disabled={!dirty || pending || currentName.trim().length < 2}
            animate={{ opacity: dirty ? 1 : 0.4 }}
            className="mt-6 w-full bg-accent py-3 font-mono text-xs uppercase tracking-[0.2em] text-accentink disabled:cursor-not-allowed"
          >
            {pending ? "Сохранение…" : "Сохранить изменения"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
