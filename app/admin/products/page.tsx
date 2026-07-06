"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/client/api";
import { useToasts } from "@/lib/client/stores";
import {
  ConfirmModal,
  Drawer,
  EmptyState,
  Pill,
  SkeletonBlock,
} from "@/components/ui";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface ProductsResponse {
  items: Product[];
  categories: string[];
}

export default function AdminProducts() {
  const pushToast = useToasts((s) => s.push);
  const [items, setItems] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<ProductsResponse>("/api/products")
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setCategories(res.categories);
      })
      .catch(() => {
        if (!cancelled) pushToast("Не удалось загрузить продукты", "error");
      });
    return () => {
      cancelled = true;
    };
  }, [refresh, pushToast]);

  const reload = () => setRefresh((r) => r + 1);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulk = async (action: "delete" | "hide" | "activate") => {
    const ids = [...selected];
    // optimistic
    setItems((list) =>
      list
        ? action === "delete"
          ? list.filter((p) => !selected.has(p.id))
          : list.map((p) =>
              selected.has(p.id)
                ? { ...p, status: action === "hide" ? "hidden" : "active" }
                : p,
            )
        : list,
    );
    setSelected(new Set());
    try {
      await api("/api/products/bulk", {
        method: "POST",
        body: JSON.stringify({ ids, action }),
      });
      pushToast(
        action === "delete"
          ? `Удалено: ${ids.length}`
          : action === "hide"
            ? `Скрыто: ${ids.length}`
            : `Активировано: ${ids.length}`,
        "ok",
      );
    } catch {
      pushToast("Массовое действие не удалось", "error");
      reload();
    }
  };

  const toggleStatus = async (p: Product) => {
    const status = p.status === "active" ? "hidden" : "active";
    setItems((list) =>
      list ? list.map((x) => (x.id === p.id ? { ...x, status } : x)) : list,
    );
    try {
      await api(`/api/products/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch {
      pushToast("Не удалось изменить статус", "error");
      reload();
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-24">
      <p className="microlabel mb-1">04 / Номенклатура</p>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1
          className="text-2xl font-semibold uppercase"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Продукты
          {items && <span className="ml-3 font-mono text-sm text-dim">({items.length})</span>}
        </h1>
        <button
          onClick={() => setEditing("new")}
          className="bg-accent px-5 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-accentink transition-opacity hover:opacity-90"
        >
          + Новый продукт
        </button>
      </div>

      {!items && (
        <div className="grid gap-px border bg-line sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-panel p-4">
              <SkeletonBlock className="mb-3 aspect-square w-full" />
              <SkeletonBlock className="mb-2 h-4 w-2/3" />
              <SkeletonBlock className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      )}

      {items && items.length === 0 && (
        <EmptyState
          title="Каталог пуст"
          hint="Создайте первый продукт — он появится в каталоге пользователей."
        />
      )}

      {items && items.length > 0 && (
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.05 }}
          className="grid gap-px border bg-line sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((p) => {
            const isSel = selected.has(p.id);
            return (
              <motion.div
                key={p.id}
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                className={cn(
                  "group relative bg-panel p-4 transition-colors",
                  isSel && "bg-panel2",
                )}
              >
                <button
                  onClick={() => toggle(p.id)}
                  aria-label="Выбрать"
                  className={cn(
                    "absolute left-6 top-6 z-10 flex h-5 w-5 items-center justify-center border transition-all",
                    isSel
                      ? "border-accent bg-accent text-accentink"
                      : "border-linestrong bg-panel opacity-0 hover:border-accent group-hover:opacity-100",
                  )}
                >
                  {isSel && "✓"}
                </button>

                <div className="relative mb-3 aspect-square overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element -- generated data-URI art */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  {p.status === "hidden" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 font-mono text-[10px] uppercase tracking-[0.3em] text-warn">
                      Скрыт
                    </span>
                  )}
                </div>

                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-ink">{p.name}</p>
                    <p className="microlabel mt-0.5">{p.category} · склад {p.stock}</p>
                  </div>
                  <p className="font-mono text-sm text-ink">{formatPrice(p.price)}</p>
                </div>

                <div className="flex items-center justify-between">
                  <Pill tone={p.status === "active" ? "ok" : "warn"}>
                    {p.status === "active" ? "активен" : "скрыт"}
                  </Pill>
                  <div className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => void toggleStatus(p)}
                      className="microlabel border px-2 py-1 transition-colors hover:border-warn hover:!text-warn"
                    >
                      {p.status === "active" ? "Скрыть" : "Показать"}
                    </button>
                    <button
                      onClick={() => setEditing(p)}
                      className="microlabel border px-2 py-1 transition-colors hover:border-accent hover:!text-accent"
                    >
                      Изм.
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* bulk action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 border bg-panel px-2 py-2 shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
          >
            <span className="microlabel px-3 !text-accent">
              Выбрано: {selected.size}
            </span>
            <button
              onClick={() => void bulk("hide")}
              className="microlabel border px-3 py-2 transition-colors hover:border-warn hover:!text-warn"
            >
              Скрыть
            </button>
            <button
              onClick={() => void bulk("activate")}
              className="microlabel border px-3 py-2 transition-colors hover:border-ok hover:!text-ok"
            >
              Активировать
            </button>
            <button
              onClick={() => setConfirmBulk(true)}
              className="microlabel border px-3 py-2 transition-colors hover:border-danger hover:!text-danger"
            >
              Удалить
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="microlabel px-3 py-2 transition-colors hover:text-ink"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={confirmBulk}
        title={`Удалить выбранные продукты (${selected.size})?`}
        detail="Продукты исчезнут из каталога и избранного пользователей."
        onConfirm={() => void bulk("delete")}
        onClose={() => setConfirmBulk(false)}
      />

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Новый продукт" : "Правка продукта"}
      >
        {editing && (
          <ProductForm
            key={editing === "new" ? "new" : editing.id}
            product={editing === "new" ? null : editing}
            categories={categories}
            onSaved={(p, created) => {
              setEditing(null);
              setItems((list) =>
                list
                  ? created
                    ? [p, ...list]
                    : list.map((x) => (x.id === p.id ? p : x))
                  : list,
              );
              pushToast(created ? "Продукт создан" : "Сохранено", "ok");
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

function ProductForm({
  product,
  categories,
  onSaved,
}: {
  product: Product | null;
  categories: string[];
  onSaved: (p: Product, created: boolean) => void;
}) {
  const pushToast = useToasts((s) => s.push);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    category: product?.category ?? categories[0] ?? "Разное",
    price: product?.price ?? 100,
    stock: product?.stock ?? 1,
    status: product?.status ?? ("active" as const),
    description: product?.description ?? "",
    image: product?.image ?? "",
  });
  const [pending, setPending] = useState(false);

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
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setPending(true);
    try {
      const body = JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) });
      const res = product
        ? await api<{ product: Product }>(`/api/products/${product.id}`, {
            method: "PATCH",
            body,
          })
        : await api<{ product: Product }>("/api/products", { method: "POST", body });
      onSaved(res.product, !product);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка сохранения", "error");
    } finally {
      setPending(false);
    }
  };

  const input =
    "w-full border bg-panel2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent";

  return (
    <div className="flex flex-col gap-5">
      {/* image upload with preview */}
      <button
        onClick={() => fileRef.current?.click()}
        className="group relative aspect-square w-full overflow-hidden border border-dashed transition-colors hover:border-accent"
      >
        {form.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- data-URI preview
          <img src={form.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="microlabel">Загрузить изображение</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/60 font-mono text-[10px] uppercase tracking-[0.2em] text-ink opacity-0 transition-opacity group-hover:opacity-100">
          Заменить
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <label className="block">
        <span className="microlabel mb-2 block">Название</span>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={input}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="microlabel mb-2 block">Категория</span>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className={input}
          >
            {[...new Set([...categories, form.category])].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="microlabel mb-2 block">Статус</span>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as Product["status"] }))
            }
            className={input}
          >
            <option value="active">Активен</option>
            <option value="hidden">Скрыт</option>
          </select>
        </label>
        <label className="block">
          <span className="microlabel mb-2 block">Цена, $</span>
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
            className={input}
          />
        </label>
        <label className="block">
          <span className="microlabel mb-2 block">Склад, шт</span>
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
            className={input}
          />
        </label>
      </div>

      <label className="block">
        <span className="microlabel mb-2 block">Описание</span>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className={cn(input, "resize-none")}
        />
      </label>

      <button
        onClick={() => void save()}
        disabled={pending || form.name.trim().length < 2}
        className="bg-accent py-3 font-mono text-xs uppercase tracking-[0.2em] text-accentink transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Сохранение…" : product ? "Сохранить" : "Создать"}
      </button>
    </div>
  );
}
