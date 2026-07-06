import type { NextRequest } from "next/server";
import { apiError, requireAuth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import type { AnalyticsPoint } from "@/lib/types";

const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, "admin");
  if ("error" in auth) return apiError(auth.error);

  const users = db().users;
  const products = db().products;
  const now = new Date();

  // Cumulative registrations per month over the last 12 months,
  // sales/activity derived deterministically so charts are stable.
  const series: AnalyticsPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const registered = users.filter(
      (u) => new Date(u.createdAt) <= monthEnd,
    ).length;
    const wave = Math.sin((now.getMonth() - i) * 1.7) * 0.5 + 1;
    series.push({
      label: MONTHS[monthEnd.getMonth()],
      users: registered,
      sales: Math.round(1800 * wave + registered * 120),
      activity: Math.round(40 * wave + registered * 2.4),
    });
  }

  const totalViews = products.reduce((s, p) => s + p.views, 0);
  const last = series[series.length - 1];
  const prev = series[series.length - 2];

  return Response.json({
    series,
    totals: {
      users: users.length,
      blocked: users.filter((u) => u.status === "blocked").length,
      products: products.length,
      hidden: products.filter((p) => p.status === "hidden").length,
      views: totalViews,
      revenue: series.reduce((s, p) => s + p.sales, 0),
      salesDelta: prev ? Math.round(((last.sales - prev.sales) / prev.sales) * 100) : 0,
    },
  });
}
