"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/client/api";
import { useToasts } from "@/lib/client/stores";
import { CountUp, SkeletonBlock } from "@/components/ui";
import { timeAgo } from "@/lib/utils";
import type { Activity, AnalyticsPoint } from "@/lib/types";

interface AnalyticsData {
  series: AnalyticsPoint[];
  totals: {
    users: number;
    blocked: number;
    products: number;
    hidden: number;
    views: number;
    revenue: number;
    salesDelta: number;
  };
}

const rise = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border bg-panel px-3 py-2">
      <p className="microlabel mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-mono text-xs text-ink">
          {p.value.toLocaleString("ru-RU")}
        </p>
      ))}
    </div>
  );
}

export default function AdminOverview() {
  const pushToast = useToasts((s) => s.push);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [activity, setActivity] = useState<Activity[] | null>(null);

  useEffect(() => {
    Promise.all([
      api<AnalyticsData>("/api/analytics"),
      api<{ items: Activity[] }>("/api/activity"),
    ])
      .then(([a, act]) => {
        setData(a);
        setActivity(act.items);
      })
      .catch(() => pushToast("Не удалось загрузить аналитику", "error"));
  }, [pushToast]);

  const stats = data
    ? [
        { label: "Пользователи", value: data.totals.users, sub: `${data.totals.blocked} заблок.` },
        { label: "Продукты", value: data.totals.products, sub: `${data.totals.hidden} скрыто` },
        { label: "Просмотры", value: data.totals.views, sub: "за всё время" },
        {
          label: "Выручка, $",
          value: data.totals.revenue,
          sub: `${data.totals.salesDelta >= 0 ? "+" : ""}${data.totals.salesDelta}% к прошлому мес.`,
        },
      ]
    : null;

  return (
    <div className="mx-auto max-w-6xl">
      <p className="microlabel mb-1">02 / Панель наблюдения</p>
      <h1
        className="mb-6 text-2xl font-semibold uppercase"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Обзор
      </h1>

      {/* stat cards */}
      <motion.div
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.07 }}
        className="mb-6 grid grid-cols-2 gap-px border bg-line lg:grid-cols-4"
      >
        {stats
          ? stats.map((s) => (
              <motion.div key={s.label} variants={rise} className="bg-panel p-5">
                <p className="microlabel mb-3">{s.label}</p>
                <p className="font-mono text-3xl text-ink">
                  <CountUp value={s.value} />
                </p>
                <p className="mt-1.5 text-[11px] text-dim">{s.sub}</p>
              </motion.div>
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-panel p-5">
                <SkeletonBlock className="mb-3 h-2.5 w-20" />
                <SkeletonBlock className="h-8 w-24" />
              </div>
            ))}
      </motion.div>

      {/* charts */}
      <div className="mb-6 grid gap-px border bg-line lg:grid-cols-2">
        <div className="bg-panel p-5">
          <p className="microlabel mb-4">Рост пользователей / 12 мес</p>
          {data ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.series}>
                <defs>
                  <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="var(--dim)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "var(--line)" }}
                />
                <YAxis stroke="var(--dim)" fontSize={10} tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--linestrong)" }} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="var(--accent)"
                  strokeWidth={1.5}
                  fill="url(#usersFill)"
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <SkeletonBlock className="h-[220px] w-full" />
          )}
        </div>

        <div className="bg-panel p-5">
          <p className="microlabel mb-4">Продажи / 12 мес</p>
          {data ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.series}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="var(--dim)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "var(--line)" }}
                />
                <YAxis stroke="var(--dim)" fontSize={10} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--glare)" }} />
                <Bar dataKey="sales" fill="var(--ink)" animationDuration={1200} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <SkeletonBlock className="h-[220px] w-full" />
          )}
        </div>
      </div>

      {/* activity feed */}
      <div className="border bg-panel">
        <div className="flex items-center justify-between hairline-b px-5 py-3.5">
          <span className="microlabel">Лента действий</span>
          <span className="microlabel text-accent">live</span>
        </div>
        {activity ? (
          <motion.ul initial="hidden" animate="show" transition={{ staggerChildren: 0.04 }}>
            {activity.slice(0, 12).map((a, i) => (
              <motion.li
                key={a.id}
                variants={rise}
                className="flex items-baseline gap-3 px-5 py-3 text-sm hairline-b last:border-b-0 hover:bg-panel2"
              >
                <span className="microlabel w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-ink">{a.actor}</span>
                <span className="text-dim">{a.action}</span>
                {a.target !== "—" && <span className="text-accent">{a.target}</span>}
                <span className="microlabel ml-auto shrink-0">{timeAgo(a.at)}</span>
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-4 w-full" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
