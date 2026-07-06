"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

/** Compact product rows used by favorites & history pages. */
export function ProductList({
  items,
  onRemove,
  removeLabel,
}: {
  items: Product[];
  onRemove?: (p: Product) => void;
  removeLabel?: string;
}) {
  return (
    <motion.ul layout className="border bg-panel">
      <AnimatePresence mode="popLayout">
        {items.map((p, i) => (
          <motion.li
            key={p.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
            exit={{ opacity: 0, x: 48 }}
            className="flex items-center gap-4 hairline-b px-4 py-3 last:border-b-0 hover:bg-panel2"
          >
            <span className="microlabel w-6 shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data-URI art */}
            <img src={p.image} alt="" className="h-12 w-12 shrink-0 border object-cover" />
            <div className="min-w-0 flex-1">
              <Link
                href={`/dashboard/product/${p.id}`}
                className="block truncate text-sm text-ink transition-colors hover:text-accent"
              >
                {p.name}
              </Link>
              <p className="microlabel mt-0.5">{p.category}</p>
            </div>
            <span className="font-mono text-sm text-ink">{formatPrice(p.price)}</span>
            {onRemove && (
              <button
                onClick={() => onRemove(p)}
                className="microlabel border px-2.5 py-1.5 transition-colors hover:border-danger hover:!text-danger"
              >
                {removeLabel ?? "Убрать"}
              </button>
            )}
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
