"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/client/stores";
import { logout } from "@/components/session";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Каталог" },
  { href: "/dashboard/favorites", label: "Избранное" },
  { href: "/dashboard/history", label: "История" },
  { href: "/dashboard/profile", label: "Профиль" },
] as const;

export function UserShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuth((s) => s.user);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 hairline-b bg-void/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="block h-2.5 w-2.5 bg-accent" />
            <span
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Foundry
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard" || pathname.startsWith("/dashboard/product")
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                    active ? "text-ink" : "text-dim hover:text-ink",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="user-nav"
                      className="absolute inset-x-2 -bottom-px h-0.5 bg-accent"
                      transition={{ type: "spring", stiffness: 480, damping: 38 }}
                    />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            {user && (
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 border py-1 pl-1 pr-3 transition-colors hover:border-linestrong"
              >
                <Avatar name={user.name} src={user.avatar} size={24} />
                <span className="hidden text-xs sm:block">{user.name}</span>
              </Link>
            )}
            <button
              onClick={() => void logout()}
              className="microlabel flex h-8 items-center border px-3 transition-colors hover:border-danger hover:text-danger"
            >
              Выход
            </button>
          </div>
        </div>
        {/* mobile nav */}
        <nav className="flex hairline-t md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 py-2.5 text-center font-mono text-[10px] uppercase tracking-wide",
                pathname === item.href ? "text-accent" : "text-dim",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>

      <footer className="hairline-t">
        <div className="microlabel mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span>Foundry © 2026</span>
          <span>Цех № 4 / линия B</span>
        </div>
      </footer>
    </div>
  );
}
