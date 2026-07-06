"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE = "a,button,input,textarea,select,label,[data-cursor]";

/**
 * Custom cursor: crisp dot follows the pointer directly, the ring trails
 * with lerp inertia and swells over interactive elements. rAF-driven,
 * transform-only. Disabled on coarse pointers.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.body.classList.add("custom-cursor");

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    let mx = -100;
    let my = -100;
    let rx = -100;
    let ry = -100;
    let scale = 1;
    let targetScale = 1;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      const hit = (e.target as Element | null)?.closest?.(INTERACTIVE);
      targetScale = hit ? 2.2 : 1;
    };

    const onDown = () => {
      targetScale = 0.7;
    };
    const onUp = () => {
      targetScale = 1;
    };

    const tick = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      scale += (targetScale - scale) * 0.18;
      dot.style.transform = `translate3d(${mx - 3}px, ${my - 3}px, 0)`;
      ring.style.transform = `translate3d(${rx - 16}px, ${ry - 16}px, 0) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.body.classList.remove("custom-cursor");
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] hidden [@media(pointer:fine)]:block">
      <div
        ref={dotRef}
        className="absolute h-1.5 w-1.5 bg-accent"
        style={{ willChange: "transform" }}
      />
      <div
        ref={ringRef}
        className="absolute h-8 w-8 rounded-full border border-ink/40"
        style={{ willChange: "transform" }}
      />
    </div>
  );
}
