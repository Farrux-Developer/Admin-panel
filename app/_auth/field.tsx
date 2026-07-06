"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  type?: string;
  value: string;
  error?: string | null;
  autoComplete?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

/**
 * Blueprint-style input: bottom hairline, mono floating label that lifts
 * on focus/value, live error line sliding in underneath.
 */
export function Field({
  label,
  type = "text",
  value,
  error,
  autoComplete,
  onChange,
  onBlur,
}: FieldProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="relative pt-5">
      <label
        htmlFor={id}
        className={cn(
          "microlabel pointer-events-none absolute left-0 transition-all duration-200",
          lifted ? "top-0 text-[9px]" : "top-[26px] text-[11px]",
          focused ? "text-accent" : error ? "text-danger" : undefined,
        )}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        className={cn(
          "w-full border-b bg-transparent py-2 text-[15px] text-ink outline-none transition-colors",
          focused
            ? "border-accent"
            : error
              ? "border-danger"
              : "border-line hover:border-linestrong",
        )}
      />
      <div className="h-5 overflow-hidden">
        <AnimatePresence>
          {error ? (
            <motion.p
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="pt-1 font-mono text-[10px] tracking-wide text-danger"
            >
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
