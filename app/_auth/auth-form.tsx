"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { loginSchema, registerSchema } from "@/lib/schemas";
import { api, setAccessToken, type AuthResponse } from "@/lib/client/api";
import { useToasts } from "@/lib/client/stores";
import { Field } from "./field";
import { Magnetic } from "@/components/magnetic";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

const EMPTY = { name: "", email: "", password: "" };

export function AuthForm() {
  const router = useRouter();
  const pushToast = useToasts((s) => s.push);

  const [mode, setMode] = useState<Mode>("login");
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<typeof EMPTY>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof typeof EMPTY, boolean>>>({});
  const [pending, setPending] = useState(false);
  const [shakeNonce, setShakeNonce] = useState(0);

  const schema = mode === "login" ? loginSchema : registerSchema;

  const validate = (vals: typeof EMPTY) => {
    const parsed = schema.safeParse(vals);
    if (parsed.success) return {};
    const next: Partial<typeof EMPTY> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof EMPTY;
      if (!next[key]) next[key] = issue.message;
    }
    return next;
  };

  const setField = (key: keyof typeof EMPTY) => (value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (touched[key]) setErrors(validate(next));
  };

  const blurField = (key: keyof typeof EMPTY) => () => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validate(values));
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setErrors({});
    setTouched({});
  };

  const submit = async () => {
    const errs = validate(values);
    setTouched({ name: true, email: true, password: true });
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setShakeNonce((n) => n + 1);
      return;
    }

    setPending(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email: values.email, password: values.password }
          : values;
      const res = await api<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setAccessToken(res.accessToken);
      pushToast(
        mode === "login" ? `Доступ открыт, ${res.user.name}` : "Аккаунт создан",
        "ok",
      );
      router.replace(res.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (e) {
      setShakeNonce((n) => n + 1);
      pushToast(e instanceof Error ? e.message : "Ошибка входа", "error");
      setPending(false);
    }
  };

  return (
    <div style={{ perspective: 1200 }}>
      {/* mode switch */}
      <div className="mb-8 flex border" role="tablist">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={cn(
              "microlabel relative flex-1 py-3 transition-colors",
              mode === m ? "text-ink" : "hover:text-ink",
            )}
          >
            {mode === m && (
              <motion.span
                layoutId="auth-tab"
                className="absolute inset-0 border border-accent"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative">{m === "login" ? "Вход" : "Регистрация"}</span>
          </button>
        ))}
      </div>

      {/* flipping form body */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ rotateY: mode === "login" ? -70 : 70, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: mode === "login" ? 70 : -70, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <motion.form
            key={shakeNonce}
            animate={shakeNonce > 0 ? { x: [0, -9, 9, -6, 6, -2, 0] } : undefined}
            transition={{ duration: 0.4 }}
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="flex flex-col gap-1"
            noValidate
          >
            {mode === "register" && (
              <Field
                label="Имя / F-01"
                value={values.name}
                error={touched.name ? errors.name : null}
                autoComplete="name"
                onChange={setField("name")}
                onBlur={blurField("name")}
              />
            )}
            <Field
              label="Email / F-02"
              type="email"
              value={values.email}
              error={touched.email ? errors.email : null}
              autoComplete="email"
              onChange={setField("email")}
              onBlur={blurField("email")}
            />
            <Field
              label="Пароль / F-03"
              type="password"
              value={values.password}
              error={touched.password ? errors.password : null}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              onChange={setField("password")}
              onBlur={blurField("password")}
            />

            <Magnetic className="mt-4">
              <button
                type="submit"
                disabled={pending}
                className="group relative w-full overflow-hidden bg-accent py-4 font-mono text-xs uppercase tracking-[0.2em] text-accentink transition-opacity disabled:opacity-60"
              >
                <span className="absolute inset-0 -translate-x-full bg-ink transition-transform duration-300 group-hover:translate-x-0" />
                <span className="relative z-10">
                  {pending
                    ? "Проверка…"
                    : mode === "login"
                      ? "Открыть доступ →"
                      : "Создать аккаунт →"}
                </span>
              </button>
            </Magnetic>
          </motion.form>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 border border-dashed p-3">
        <p className="microlabel mb-1.5 text-accent">Демо-доступ</p>
        <p className="font-mono text-[11px] leading-relaxed text-dim">
          admin@foundry.dev / admin1234
          <br />
          user@foundry.dev / user1234
        </p>
      </div>
    </div>
  );
}
