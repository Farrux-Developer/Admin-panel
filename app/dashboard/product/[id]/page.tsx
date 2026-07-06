"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/client/api";
import { useToasts } from "@/lib/client/stores";
import { Pill, SkeletonBlock } from "@/components/ui";
import { FavButton } from "../../_components/fav-button";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pushToast = useToasts((s) => s.push);

  const [product, setProduct] = useState<Product | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [added, setAdded] = useState(false);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    api<{ product: Product; favorite: boolean }>(`/api/products/${id}`)
      .then((res) => {
        setProduct(res.product);
        setFavorite(res.favorite);
        void api(`/api/products/${id}/view`, { method: "POST" }).catch(() => {});
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const toggleFav = async () => {
    setFavorite((f) => !f);
    try {
      const res = await api<{ favorite: boolean }>(`/api/products/${id}/favorite`, {
        method: "POST",
      });
      setFavorite(res.favorite);
    } catch {
      setFavorite((f) => !f);
      pushToast("Не удалось обновить избранное", "error");
    }
  };

  const acquire = () => {
    setAdded(true);
    pushToast(`${product?.name} — заявка оформлена`, "ok", "Мастерская свяжется с вами");
    setTimeout(() => setAdded(false), 1600);
  };

  if (notFound) {
    return (
      <div className="py-24 text-center">
        <p className="microlabel mb-3">404 / Объект не найден</p>
        <Link href="/dashboard" className="text-sm text-accent hover:underline">
          ← Вернуться в каталог
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="grid gap-10 lg:grid-cols-2">
        <SkeletonBlock className="aspect-square w-full" />
        <div className="space-y-4 pt-4">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-9 w-2/3" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
      </div>
    );
  }

  // "gallery": the artwork plus generated detail crops
  const frames = [
    { label: "Общий вид", style: {} },
    { label: "Деталь A", style: { transform: "scale(2) translate(12%, 10%)" } },
    { label: "Деталь B", style: { transform: "scale(2.4) translate(-14%, -8%)" } },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href="/dashboard" className="microlabel transition-colors hover:text-accent">
        ← Каталог
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-2">
        {/* gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden border bg-panel">
            <motion.div
              key={frame}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              className="h-full w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- generated data-URI art */}
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500"
                style={frames[frame].style}
              />
            </motion.div>
            <span className="microlabel absolute bottom-3 left-3 border bg-void/80 px-2 py-1">
              {frames[frame].label}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            {frames.map((f, i) => (
              <button
                key={f.label}
                onClick={() => setFrame(i)}
                className={cn(
                  "relative aspect-square w-20 overflow-hidden border transition-colors",
                  frame === i ? "border-accent" : "hover:border-linestrong",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- generated data-URI art */}
                <img
                  src={product.image}
                  alt=""
                  className="h-full w-full object-cover"
                  style={f.style}
                />
              </button>
            ))}
          </div>
        </div>

        {/* info */}
        <div className="flex flex-col">
          <p className="microlabel mb-2">
            {product.category} / арт. {product.id.slice(-6).toUpperCase()}
          </p>
          <h1
            className="mb-4 text-3xl font-semibold uppercase leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {product.name}
          </h1>

          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-2xl text-ink">{formatPrice(product.price)}</span>
            <Pill tone={product.stock > 0 ? "ok" : "danger"}>
              {product.stock > 0 ? `в наличии: ${product.stock}` : "нет в наличии"}
            </Pill>
          </div>

          <p className="mb-8 max-w-md text-sm leading-relaxed text-dim">
            {product.description}
          </p>

          <div className="mb-8 grid max-w-md grid-cols-3 gap-px border bg-line">
            {[
              ["Серия", "F-7"],
              ["Просмотры", String(product.views)],
              ["Паспорт", "Включён"],
            ].map(([k, v]) => (
              <div key={k} className="bg-panel px-3 py-2.5">
                <p className="microlabel">{k}</p>
                <p className="mt-1 font-mono text-xs text-ink">{v}</p>
              </div>
            ))}
          </div>

          <div className="flex max-w-md items-stretch gap-2.5">
            <motion.button
              onClick={acquire}
              disabled={product.stock === 0}
              whileTap={{ scale: 0.97 }}
              className="relative flex-1 overflow-hidden bg-accent py-4 font-mono text-xs uppercase tracking-[0.2em] text-accentink disabled:opacity-40"
            >
              <motion.span
                animate={{ y: added ? -34 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className="block"
              >
                Оформить заявку
              </motion.span>
              <motion.span
                animate={{ y: added ? -22 : 12 }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className="absolute inset-x-0 block"
              >
                ✓ Принято
              </motion.span>
            </motion.button>
            <FavButton active={favorite} onToggle={() => void toggleFav()} className="h-auto w-14" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
