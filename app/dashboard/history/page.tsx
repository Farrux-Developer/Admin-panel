"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { useToasts } from "@/lib/client/stores";
import { EmptyState, SkeletonBlock } from "@/components/ui";
import { ProductList } from "../_components/product-list";
import type { Product } from "@/lib/types";

export default function HistoryPage() {
  const pushToast = useToasts((s) => s.push);
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    api<{ history: Product[] }>("/api/me")
      .then((res) => setItems(res.history))
      .catch(() => pushToast("Не удалось загрузить историю", "error"));
  }, [pushToast]);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="microlabel mb-1">07 / Журнал просмотров</p>
      <h1
        className="mb-6 text-2xl font-semibold uppercase"
        style={{ fontFamily: "var(--font-display)" }}
      >
        История
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
          title="История пуста"
          hint="Откройте любой объект в каталоге — визит будет записан в журнал."
        />
      )}
      {items && items.length > 0 && <ProductList items={items} />}
    </div>
  );
}
