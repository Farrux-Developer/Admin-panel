"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToasts, type Toast } from "@/lib/client/stores";
import { cn } from "@/lib/utils";

const KIND_META: Record<Toast["kind"], { mark: string; cls: string }> = {
  ok: { mark: "OK", cls: "text-ok border-ok/40" },
  error: { mark: "ERR", cls: "text-danger border-danger/40" },
  info: { mark: "SYS", cls: "text-accent border-accent/40" },
};

export function Toaster() {
  const { toasts, dismiss } = useToasts();

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[9000] flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const meta = KIND_META[t.kind];
          return (
            <motion.button
              key={t.id}
              layout
              initial={{ opacity: 0, x: 64, skewX: -6 }}
              animate={{ opacity: 1, x: 0, skewX: 0 }}
              exit={{ opacity: 0, x: 96, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 480, damping: 34 }}
              onClick={() => dismiss(t.id)}
              className="pointer-events-auto border bg-panel text-left"
            >
              <div className="flex items-stretch">
                <span
                  className={cn(
                    "microlabel flex w-12 shrink-0 items-center justify-center border-r",
                    meta.cls,
                  )}
                >
                  {meta.mark}
                </span>
                <span className="px-3 py-2.5">
                  <span className="block text-sm text-ink">{t.title}</span>
                  {t.detail ? (
                    <span className="mt-0.5 block text-xs text-dim">{t.detail}</span>
                  ) : null}
                </span>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
