"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/client/api";
import { useToasts } from "@/lib/client/stores";
import { EmptyState, SkeletonBlock } from "@/components/ui";
import { TiltCard } from "./_components/tilt-card";
import { FavButton } from "./_components/fav-button";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface CatalogResponse {
  items: Product[];
  categories: string[];
  favorites: string[];
}

export default function Catalog() {
  const pushToast = useToasts((s) => s.push);
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    api<CatalogResponse>("/api/products")
      .then((res) => {
        setData(res);
        setFavorites(new Set(res.favorites));
      })
      .catch(() => pushToast("Не удалось загрузить каталог", "error"));
  }, [pushToast]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.items.filter(
      (p) =>
        (!category || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
  }, [data, query, category]);

  const toggleFav = async (p: Product) => {
    const next = new Set(favorites);
    const adding = !next.has(p.id);
    if (adding) next.add(p.id);
    else next.delete(p.id);
    setFavorites(next);
    try {
      await api(`/api/products/${p.id}/favorite`, { method: "POST" });
      if (adding) pushToast(`${p.name} — в избранном`, "ok");
    } catch {
      setFavorites(favorites); // rollback
      pushToast("Не удалось обновить избранное", "error");
    }
  };

  return (
    <div>
      <p className="microlabel mb-1">05 / Каталог объектов</p>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1
          className="text-3xl font-semibold uppercase"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Объекты<span className="text-accent">.</span>
        </h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию…"
          className="w-64 border bg-panel px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-dim focus:border-accent"
        />
      </div>

      {/* category filter */}
      {data && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory(null)}
            className={cn(
              "microlabel border px-3 py-1.5 transition-colors",
              !category ? "border-accent !text-accent" : "hover:border-linestrong hover:text-ink",
            )}
          >
            Все
          </button>
          {data.categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? null : c)}
              className={cn(
                "microlabel border px-3 py-1.5 transition-colors",
                category === c
                  ? "border-accent !text-accent"
                  : "hover:border-linestrong hover:text-ink",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {!data && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border bg-panel p-4">
              <SkeletonBlock className="mb-3 aspect-square w-full" />
              <SkeletonBlock className="mb-2 h-4 w-2/3" />
              <SkeletonBlock className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      )}

      {data && filtered.length === 0 && (
        <EmptyState
          title="По запросу ничего нет"
          hint="Смените категорию или сформулируйте иначе."
        />
      )}

      <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              <TiltCard>
                <Link
                  href={`/dashboard/product/${p.id}`}
                  className="block border bg-panel p-4 transition-colors hover:border-linestrong"
                >
                  <div className="relative mb-4 aspect-square overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element -- generated data-URI art */}
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    <FavButton
                      active={favorites.has(p.id)}
                      onToggle={() => void toggleFav(p)}
                      className="absolute right-2 top-2"
                    />
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-ink">{p.name}</p>
                      <p className="microlabel mt-1">{p.category}</p>
                    </div>
                    <p className="font-mono text-sm text-ink">{formatPrice(p.price)}</p>
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
