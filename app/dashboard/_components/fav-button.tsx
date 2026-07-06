"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FavButton({
  active,
  onToggle,
  className,
}: {
  active: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-label={active ? "Убрать из избранного" : "В избранное"}
      className={cn(
        "flex h-9 w-9 items-center justify-center border bg-panel transition-colors",
        active ? "border-accent text-accent" : "text-dim hover:border-linestrong hover:text-ink",
        className,
      )}
    >
      <motion.svg
        key={String(active)}
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 18 }}
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <path d="M8 14 C 2 10 1 5.5 3.5 3.5 C 5.5 2 7.5 3 8 4.5 C 8.5 3 10.5 2 12.5 3.5 C 15 5.5 14 10 8 14 Z" />
      </motion.svg>
    </motion.button>
  );
}
