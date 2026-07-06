"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Dark by default; the choice persists in localStorage. */
export function ThemeToggle({ className }: { className?: string }) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("fdry_theme") === "light";
    document.documentElement.classList.toggle("light", saved);
    // deferred so the state sync doesn't cascade inside the effect
    const raf = requestAnimationFrame(() => setLight(saved));
    return () => cancelAnimationFrame(raf);
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("fdry_theme", next ? "light" : "dark");
  };

  return (
    <button
      onClick={toggle}
      aria-label="Переключить тему"
      className={cn(
        "microlabel flex h-8 items-center gap-2 border px-3 transition-colors hover:border-linestrong hover:text-ink",
        className,
      )}
    >
      <span
        className={cn(
          "block h-2 w-2 rounded-full transition-colors",
          light ? "bg-warn" : "bg-accent",
        )}
      />
      {light ? "Свет" : "Тьма"}
    </button>
  );
}
