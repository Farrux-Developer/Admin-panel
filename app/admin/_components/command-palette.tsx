"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { logout } from "@/components/session";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  hint: string;
  run: () => void;
}

export function CommandPalette({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  // Global hotkey
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && <PaletteBody close={() => setOpen(false)} />}
    </AnimatePresence>
  );
}

/** Mounted fresh on every open, so query/cursor state resets naturally. */
function PaletteBody({ close }: { close: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  const commands = useMemo<Command[]>(
    () => [
      { id: "overview", label: "Обзор", hint: "перейти", run: () => router.push("/admin") },
      { id: "users", label: "Пользователи", hint: "перейти", run: () => router.push("/admin/users") },
      { id: "products", label: "Продукты", hint: "перейти", run: () => router.push("/admin/products") },
      { id: "catalog", label: "Каталог (вид пользователя)", hint: "перейти", run: () => router.push("/dashboard") },
      {
        id: "theme",
        label: "Переключить тему",
        hint: "действие",
        run: () => {
          const light = document.documentElement.classList.toggle("light");
          localStorage.setItem("fdry_theme", light ? "light" : "dark");
        },
      },
      { id: "logout", label: "Выйти из системы", hint: "действие", run: () => void logout() },
    ],
    [router],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;
  }, [commands, query]);

  const execute = (cmd: Command) => {
    close();
    cmd.run();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[8500] bg-black/70 p-4 pt-[18vh]"
      onClick={close}
    >
      <motion.div
        initial={{ y: -16, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: -16, scale: 0.98, opacity: 0 }}
        transition={{ type: "spring", stiffness: 460, damping: 36 }}
        className="mx-auto w-full max-w-lg border bg-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 hairline-b px-4">
          <span className="microlabel text-accent">CMD</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              } else if (e.key === "Enter" && filtered[cursor]) {
                execute(filtered[cursor]);
              } else if (e.key === "Escape") {
                close();
              }
            }}
            placeholder="Куда направляемся?"
            className="w-full bg-transparent py-3.5 text-sm text-ink outline-none placeholder:text-dim"
          />
          <kbd className="microlabel border px-1.5 py-0.5">ESC</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto py-1.5">
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-xs text-dim">
              Ничего не найдено
            </li>
          )}
          {filtered.map((cmd, i) => (
            <li key={cmd.id}>
              <button
                onMouseEnter={() => setCursor(i)}
                onClick={() => execute(cmd)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors",
                  i === cursor ? "bg-panel2 text-ink" : "text-dim",
                )}
              >
                <span className="flex items-center gap-3">
                  {i === cursor && <span className="block h-1.5 w-1.5 bg-accent" />}
                  {cmd.label}
                </span>
                <span className="microlabel">{cmd.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
