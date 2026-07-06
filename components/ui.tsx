"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------ CountUp ------------------------------ */

export function CountUp({
  value,
  duration = 1.1,
  format = (n: number) => Math.round(n).toLocaleString("ru-RU"),
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [text, setText] = useState("0");

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setText(format(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, format]);

  return <span ref={ref}>{text}</span>;
}

/* ------------------------------- Pill -------------------------------- */

export function Pill({
  tone,
  children,
}: {
  tone: "ok" | "danger" | "warn" | "dim";
  children: ReactNode;
}) {
  const tones = {
    ok: "text-ok border-ok/40",
    danger: "text-danger border-danger/40",
    warn: "text-warn border-warn/40",
    dim: "text-dim border-line",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
        tones[tone],
      )}
    >
      <span className="block h-1 w-1 rounded-full bg-current" />
      {children}
    </span>
  );
}

/* ------------------------------ Modal -------------------------------- */

export function Modal({
  open,
  onClose,
  children,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/70 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 24, scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={cn("w-full border bg-panel", width)}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({
  open,
  title,
  detail,
  confirmLabel = "Удалить",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  detail?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="hairline-b px-5 py-3">
        <span className="microlabel text-danger">Подтверждение</span>
      </div>
      <div className="px-5 py-5">
        <p className="text-sm text-ink">{title}</p>
        {detail ? <p className="mt-1.5 text-xs text-dim">{detail}</p> : null}
      </div>
      <div className="flex hairline-t">
        <button
          onClick={onClose}
          className="microlabel flex-1 border-r py-3 transition-colors hover:bg-panel2 hover:text-ink"
        >
          Отмена
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="microlabel flex-1 py-3 !text-danger transition-colors hover:bg-danger hover:!text-void"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------ Drawer ------------------------------- */

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[8000] bg-black/60"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l bg-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between hairline-b px-5 py-4">
              <span className="microlabel text-ink">{title}</span>
              <button
                onClick={onClose}
                className="microlabel transition-colors hover:text-accent"
              >
                Закрыть ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------- EmptyState ----------------------------- */

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed px-6 py-16 text-center">
      <svg width="72" height="72" viewBox="0 0 72 72" className="mb-5 text-dim">
        <rect x="8" y="8" width="56" height="56" fill="none" stroke="currentColor" />
        <path d="M8 8 L64 64 M64 8 L8 64" stroke="currentColor" strokeWidth="0.75" />
        <circle cx="36" cy="36" r="10" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
      </svg>
      <p className="text-sm text-ink">{title}</p>
      {hint ? <p className="mt-1.5 max-w-xs text-xs text-dim">{hint}</p> : null}
    </div>
  );
}

/* ----------------------------- Skeletons ----------------------------- */

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="hairline-b">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="skeleton h-3.5 w-full max-w-[140px]" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

/* ------------------------------ Avatar ------------------------------- */

export function Avatar({
  name,
  src,
  size = 32,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- data-URI avatars
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className="shrink-0 border object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="flex shrink-0 items-center justify-center border bg-panel2 font-mono text-[10px] text-dim"
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}
