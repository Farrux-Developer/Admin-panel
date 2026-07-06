"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/client/api";
import { useAuth, useToasts } from "@/lib/client/stores";
import {
  Avatar,
  ConfirmModal,
  Drawer,
  EmptyState,
  Pill,
  SkeletonRow,
} from "@/components/ui";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import type { Paginated, PublicUser } from "@/lib/types";

type SortKey = "name" | "email" | "createdAt" | "lastActiveAt";

const COLUMNS: Array<{ key: SortKey | null; label: string }> = [
  { key: "name", label: "Пользователь" },
  { key: null, label: "Роль / статус" },
  { key: "createdAt", label: "Создан" },
  { key: "lastActiveAt", label: "Активность" },
  { key: null, label: "" },
];

export default function AdminUsers() {
  const pushToast = useToasts((s) => s.push);
  const me = useAuth((s) => s.user);

  const [result, setResult] = useState<{
    key: string;
    data: Paginated<PublicUser>;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<PublicUser | null>(null);
  const [deleting, setDeleting] = useState<PublicUser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // `loading` is derived: the stored result is tagged with the request key.
  const key = [debounced, sort, dir, page, role, status, refresh].join("|");
  const data = result?.data ?? null;
  const loading = result?.key !== key;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ q: debounced, sort, dir, page: String(page) });
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    api<Paginated<PublicUser>>(`/api/users?${params}`)
      .then((res) => {
        if (!cancelled) setResult({ key, data: res });
      })
      .catch(() => {
        if (!cancelled) pushToast("Не удалось загрузить пользователей", "error");
      });
    return () => {
      cancelled = true;
    };
  }, [key, debounced, sort, dir, page, role, status, pushToast]);

  const reload = () => setRefresh((r) => r + 1);
  const mutateData = (fn: (d: Paginated<PublicUser>) => Paginated<PublicUser>) =>
    setResult((r) => (r ? { ...r, data: fn(r.data) } : r));

  const patch = async (user: PublicUser, body: Partial<PublicUser>, label: string) => {
    setBusyId(user.id);
    // optimistic update
    mutateData((d) => ({
      ...d,
      items: d.items.map((u) => (u.id === user.id ? { ...u, ...body } : u)),
    }));
    try {
      await api(`/api/users/${user.id}`, { method: "PATCH", body: JSON.stringify(body) });
      pushToast(label, "ok");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка", "error");
      reload(); // rollback to server truth
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (user: PublicUser) => {
    mutateData((d) => ({
      ...d,
      items: d.items.filter((u) => u.id !== user.id),
      total: d.total - 1,
    }));
    try {
      await api(`/api/users/${user.id}`, { method: "DELETE" });
      pushToast(`${user.name} удалён`, "ok");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка", "error");
      reload();
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("asc");
    }
    setPage(1);
  };

  const filterBtn = (
    active: boolean,
    label: string,
    onClick: () => void,
  ) => (
    <button
      key={label}
      onClick={onClick}
      className={cn(
        "microlabel border px-3 py-1.5 transition-colors",
        active ? "border-accent !text-accent" : "hover:border-linestrong hover:text-ink",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <p className="microlabel mb-1">03 / Реестр персонала</p>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1
          className="text-2xl font-semibold uppercase"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Пользователи
          {data && <span className="ml-3 font-mono text-sm text-dim">({data.total})</span>}
        </h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по имени или email…"
          className="w-64 border bg-panel px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-dim focus:border-accent"
        />
      </div>

      {/* filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filterBtn(role === "", "Все роли", () => { setRole(""); setPage(1); })}
        {filterBtn(role === "admin", "Админы", () => { setRole("admin"); setPage(1); })}
        {filterBtn(role === "user", "Юзеры", () => { setRole("user"); setPage(1); })}
        <span className="mx-1 w-px bg-line" />
        {filterBtn(status === "", "Любой статус", () => { setStatus(""); setPage(1); })}
        {filterBtn(status === "active", "Активные", () => { setStatus("active"); setPage(1); })}
        {filterBtn(status === "blocked", "Заблокированные", () => { setStatus("blocked"); setPage(1); })}
      </div>

      <div className="overflow-x-auto border bg-panel">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="hairline-b">
              {COLUMNS.map((col) => (
                <th key={col.label} className="px-4 py-3 text-left">
                  {col.key ? (
                    <button
                      onClick={() => toggleSort(col.key!)}
                      className={cn(
                        "microlabel flex items-center gap-1.5 transition-colors hover:text-ink",
                        sort === col.key && "!text-accent",
                      )}
                    >
                      {col.label}
                      {sort === col.key && <span>{dir === "asc" ? "↑" : "↓"}</span>}
                    </button>
                  ) : (
                    <span className="microlabel">{col.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
            {!loading &&
              data?.items.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className={cn(
                    "hairline-b transition-colors last:border-b-0 hover:bg-panel2",
                    busyId === u.id && "opacity-50",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} src={u.avatar} size={30} />
                      <div>
                        <p className="text-ink">
                          {u.name}
                          {u.id === me?.id && (
                            <span className="microlabel ml-2 text-accent">вы</span>
                          )}
                        </p>
                        <p className="font-mono text-[11px] text-dim">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Pill tone={u.role === "admin" ? "warn" : "dim"}>{u.role}</Pill>
                      <Pill tone={u.status === "active" ? "ok" : "danger"}>
                        {u.status === "active" ? "актив" : "блок"}
                      </Pill>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-dim">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-dim">
                    {timeAgo(u.lastActiveAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() =>
                          patch(
                            u,
                            { status: u.status === "active" ? "blocked" : "active" },
                            u.status === "active" ? `${u.name} заблокирован` : `${u.name} разблокирован`,
                          )
                        }
                        disabled={u.id === me?.id}
                        className="microlabel border px-2.5 py-1.5 transition-colors hover:border-warn hover:!text-warn disabled:opacity-30"
                      >
                        {u.status === "active" ? "Блок" : "Разблок"}
                      </button>
                      <button
                        onClick={() =>
                          patch(
                            u,
                            { role: u.role === "admin" ? "user" : "admin" },
                            `Роль обновлена: ${u.role === "admin" ? "user" : "admin"}`,
                          )
                        }
                        disabled={u.id === me?.id}
                        className="microlabel border px-2.5 py-1.5 transition-colors hover:border-linestrong hover:text-ink disabled:opacity-30"
                      >
                        Роль
                      </button>
                      <button
                        onClick={() => setEditing(u)}
                        className="microlabel border px-2.5 py-1.5 transition-colors hover:border-accent hover:!text-accent"
                      >
                        Изм.
                      </button>
                      <button
                        onClick={() => setDeleting(u)}
                        disabled={u.id === me?.id}
                        className="microlabel border px-2.5 py-1.5 transition-colors hover:border-danger hover:!text-danger disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
          </tbody>
        </table>
        {!loading && data?.items.length === 0 && (
          <div className="p-6">
            <EmptyState
              title="Никого не нашлось"
              hint="Попробуйте смягчить фильтры или изменить запрос."
            />
          </div>
        )}
      </div>

      {/* pagination */}
      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="microlabel">
            стр. {data.page} / {data.pages}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="microlabel border px-3 py-1.5 transition-colors hover:border-linestrong hover:text-ink disabled:opacity-30"
            >
              ← Назад
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page >= data.pages}
              className="microlabel border px-3 py-1.5 transition-colors hover:border-linestrong hover:text-ink disabled:opacity-30"
            >
              Вперёд →
            </button>
          </div>
        </div>
      )}

      {/* edit drawer */}
      <Drawer open={!!editing} onClose={() => setEditing(null)} title="Правка пользователя">
        {editing && (
          <EditUserForm
            key={editing.id}
            user={editing}
            onSaved={(u) => {
              setEditing(null);
              mutateData((d) => ({
                ...d,
                items: d.items.map((x) => (x.id === u.id ? u : x)),
              }));
              pushToast("Сохранено", "ok");
            }}
          />
        )}
      </Drawer>

      <ConfirmModal
        open={!!deleting}
        title={`Удалить пользователя ${deleting?.name}?`}
        detail="Действие необратимо. Все данные пользователя будут стёрты."
        onConfirm={() => deleting && void remove(deleting)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function EditUserForm({
  user,
  onSaved,
}: {
  user: PublicUser;
  onSaved: (u: PublicUser) => void;
}) {
  const pushToast = useToasts((s) => s.push);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [pending, setPending] = useState(false);

  const save = async () => {
    setPending(true);
    try {
      const res = await api<{ user: PublicUser }>(`/api/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, email }),
      });
      onSaved(res.user);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка сохранения", "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <label className="block">
        <span className="microlabel mb-2 block">Имя</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border bg-panel2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
        />
      </label>
      <label className="block">
        <span className="microlabel mb-2 block">Email</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border bg-panel2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
        />
      </label>
      <button
        onClick={() => void save()}
        disabled={pending}
        className="bg-accent py-3 font-mono text-xs uppercase tracking-[0.2em] text-accentink transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Сохранение…" : "Сохранить"}
      </button>
    </div>
  );
}
