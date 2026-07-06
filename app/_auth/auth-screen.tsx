"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { AuthForm } from "./auth-form";

const AuthScene = dynamic(() => import("./scene"), { ssr: false });

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const rise = {
  hidden: { y: 28, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function AuthScreen() {
  return (
    <div className="relative flex min-h-dvh overflow-hidden bg-[#0b0b0d] text-[#e9e4da]">
      {/* 3D backdrop */}
      <div className="absolute inset-0">
        <AuthScene />
      </div>

      {/* corner registration marks */}
      <div className="pointer-events-none absolute inset-4 hidden border border-[#232328] lg:block" />

      {/* left: manifesto */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="pointer-events-none relative z-10 hidden flex-1 flex-col justify-between p-12 lg:flex"
      >
        <motion.div variants={rise} className="flex items-center gap-3">
          <span className="block h-3 w-3 bg-[#ff5c28]" />
          <span className="font-mono text-xs uppercase tracking-[0.3em]">
            Foundry / система объектов
          </span>
        </motion.div>

        <motion.div variants={rise}>
          <h1
            className="text-[clamp(3.5rem,7vw,7rem)] font-bold uppercase leading-[0.92]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Каждый
            <br />
            объект —<br />
            <span className="text-[#ff5c28]">учтён.</span>
          </h1>
        </motion.div>

        <motion.div
          variants={rise}
          className="flex items-end justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a8578]"
        >
          <span>
            55.7558° N — 37.6173° E
            <br />
            Цех № 4, линия B
          </span>
          <span className="text-right">
            Малые серии. Нумерованные экземпляры.
            <br />
            Допуск по стандарту F-7.
          </span>
        </motion.div>
      </motion.div>

      {/* right: access panel */}
      <motion.aside
        initial={{ x: 64, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="relative z-10 flex w-full flex-col justify-center border-l border-[#232328] bg-[#0b0b0d]/95 px-8 py-12 sm:px-14 lg:w-[480px]"
      >
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.p
            variants={rise}
            className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#8a8578]"
          >
            01 / Доступ
          </motion.p>
          <motion.h2
            variants={rise}
            className="mb-10 text-3xl font-semibold uppercase"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Foundry<span className="text-[#ff5c28]">.</span>
          </motion.h2>
          <motion.div variants={rise}>
            <AuthForm />
          </motion.div>
        </motion.div>
      </motion.aside>
    </div>
  );
}
