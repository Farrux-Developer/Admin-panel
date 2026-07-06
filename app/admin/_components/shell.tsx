"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/client/stores";
import { logout } from "@/components/session";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./command-palette";

export const NAV = [
  {
    href: "/admin",
    label: "Обзор",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
        <rect x="1.5" y="1.5" width="5.5" height="5.5" />
        <rect x="9" y="1.5" width="5.5" height="5.5" />
        <rect x="1.5" y="9" width="5.5" height="5.5" />
        <rect x="9" y="9" width="5.5" height="5.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Пользователи",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
        <circle cx="8" cy="5" r="3" />
        <path d="M2 14 c0-3.3 2.7-5 6-5 s6 1.7 6 5" />
      </svg>
    ),
  },
  {
    href: "/admin/products",
    label: "Продукты",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
        <path d="M8 1.5 L14 5 v6 L8 14.5 L2 11 V5 Z" />
        <path d="M2 5 L8 8.5 L14 5 M8 8.5 V14.5" />
      </svg>
    ),
  },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuth((s) => s.user);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const crumb =
    NAV.find((n) => n.href !== "/admin" && pathname.startsWith(n.href))?.label ??
    "Обзор";

  return (
    <div className="flex min-h-dvh">
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />

      {/* sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 236 }}
        transition={{ type: "spring", stiffness: 360, damping: 36 }}
        className="sticky top-0 z-40 flex h-dvh shrink-0 flex-col overflow-hidden border-r bg-panel"
      >
        <div className="flex h-14 items-center gap-3 hairline-b px-5">
          <span className="block h-2.5 w-2.5 shrink-0 bg-accent" />
          {!collapsed && (
            <span
              className="whitespace-nowrap text-sm font-semibold uppercase tracking-wide"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Foundry<span className="text-accent">/adm</span>
            </span>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex h-10 items-center gap-3 px-3 transition-colors",
                  active ? "text-ink" : "text-dim hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="admin-nav"
                    className="absolute inset-0 border border-line bg-panel2"
                    transition={{ type: "spring", stiffness: 480, damping: 38 }}
                  />
                )}
                {active && (
                  <span className="absolute left-0 top-0 h-full w-0.5 bg-accent" />
                )}
                <span className="relative shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="relative whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em]">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="microlabel flex h-11 items-center justify-center gap-2 hairline-t transition-colors hover:text-ink"
          aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }}>«</motion.span>
          {!collapsed && "Свернуть"}
        </button>
      </motion.aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between hairline-b bg-void/90 px-6 backdrop-blur-sm">
          <div className="microlabel flex items-center gap-2">
            <span>Admin</span>
            <span className="text-linestrong">/</span>
            <span className="text-ink">{crumb}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setPaletteOpen(true)}
              className="microlabel flex h-8 items-center gap-2 border px-3 transition-colors hover:border-linestrong hover:text-ink"
            >
              Поиск
              <kbd className="border px-1.5 py-px font-mono text-[9px]">⌘K</kbd>
            </button>
            <ThemeToggle />
            {user && (
              <div className="flex items-center gap-2 border py-1 pl-1 pr-3">
                <Avatar name={user.name} src={user.avatar} size={24} />
                <span className="hidden text-xs sm:block">{user.name}</span>
              </div>
            )}
            <button
              onClick={() => void logout()}
              className="microlabel flex h-8 items-center border px-3 transition-colors hover:border-danger hover:text-danger"
            >
              Выход
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
