"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { useToasts } from "@/lib/client/stores";
import { EmptyState, SkeletonBlock } from "@/components/ui";
import { ProductList } from "../_components/product-list";
import type { Product } from "@/lib/types";

export default function FavoritesPage() {
  const pushToast = useToasts((s) => s.push);
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    api<{ favorites: Product[] }>("/api/me")
      .then((res) => setItems(res.favorites))
      .catch(() => pushToast("Не удалось загрузить избранное", "error"));
  }, [pushToast]);

  const remove = async (p: Product) => {
    setItems((list) => list?.filter((x) => x.id !== p.id) ?? null);
    try {
      await api(`/api/products/${p.id}/favorite`, { method: "POST" });
    } catch {
      pushToast("Не удалось убрать из избранного", "error");
      setItems((list) => (list ? [p, ...list] : [p]));
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <p className="microlabel mb-1">06 / Отобранное вручную</p>
      <h1
        className="mb-6 text-2xl font-semibold uppercase"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Избранное
      </h1>

      {!items && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-16 w-full" />
          ))}
        </div>
      )}
      {items && items.length === 0 && (
        <EmptyState
          title="Пока пусто"
          hint="Отмечайте объекты сердцем в каталоге — они соберутся здесь."
        />
      )}
      {items && items.length > 0 && <ProductList items={items} onRemove={remove} />}
    </div>
  );
}
