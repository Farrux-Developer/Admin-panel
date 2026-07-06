"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";

/**
 * 3D tilt card: rotates toward the pointer with a moving specular glare.
 * Springs handle the return, transforms only — no layout work.
 */
export function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const srx = useSpring(rx, { stiffness: 260, damping: 20 });
  const sry = useSpring(ry, { stiffness: 260, damping: 20 });
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, var(--glare), transparent 60%)`;

  return (
    <div style={{ perspective: 900 }} className={className}>
      <motion.div
        ref={ref}
        style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d", willChange: "transform" }}
        onMouseMove={(e) => {
          const rect = ref.current!.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          ry.set((px - 0.5) * 14);
          rx.set((0.5 - py) * 14);
          gx.set(px * 100);
          gy.set(py * 100);
        }}
        onMouseLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
        className="group relative h-full"
      >
        {children}
        <motion.div
          aria-hidden
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      </motion.div>
    </div>
  );
}
