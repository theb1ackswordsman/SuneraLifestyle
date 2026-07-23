"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, IndianRupee, ShoppingBag, Users, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RevenueData {
  total: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
}

interface OrdersData {
  total: number;
  thisMonth: number;
  byStatus: { status: string; count: number }[];
}

interface CustomersData {
  total: number;
  thisMonth: number;
}

interface TopProduct {
  _id: string;
  name: string;
  image: string;
  slug: string;
  revenue: number;
  units: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

interface AnalyticsData {
  revenue: RevenueData;
  orders: OrdersData;
  customers: CustomersData;
  topProducts: TopProduct[];
  dailyRevenue: DailyRevenue[];
  recentOrders: RecentOrder[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STATUS_COLOR: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700",
  confirmed:  "bg-blue-100 text-blue-700",
  packed:     "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  shipped:    "bg-purple-100 text-purple-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
  returned:   "bg-orange-100 text-orange-700",
  refunded:   "bg-gray-100 text-gray-700",
};

const STATUS_BAR_COLOR: Record<string, string> = {
  pending:    "bg-amber-400",
  confirmed:  "bg-blue-400",
  packed:     "bg-blue-500",
  processing: "bg-blue-400",
  shipped:    "bg-purple-500",
  delivered:  "bg-green-500",
  cancelled:  "bg-red-400",
  returned:   "bg-orange-400",
  refunded:   "bg-gray-400",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function abbreviateDate(dateStr: string) {
  // dateStr is "YYYY-MM-DD"
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  growth?: number;
  iconBg: string;
}

function StatCard({ icon: Icon, label, value, sub, growth, iconBg }: StatCardProps) {
  const hasGrowth = growth !== undefined;
  const isPositive = hasGrowth && growth >= 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
        {hasGrowth && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
              isPositive
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-0.5">{label}</p>
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-gray-100", className)} />;
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recharts custom tooltip
// ---------------------------------------------------------------------------
function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-600 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-gray-900 font-bold">
          {p.name === "revenue" ? `₹${p.value.toLocaleString("en-IN")}` : `${p.value} orders`}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/analytics", {
      headers: {
        "x-user-role": "admin",
        "x-admin-verified": "1",
      },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const totalStatusCount =
    data?.orders.byStatus.reduce((acc, s) => acc + s.count, 0) ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a5c14]/10">
          <BarChart2 className="h-5 w-5 text-[#1a5c14]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-500">Sales performance and business insights</p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stat cards                                                          */}
      {/* ------------------------------------------------------------------ */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
          Failed to load analytics data.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={IndianRupee}
            label="Total Revenue"
            value={`₹${fmt(data!.revenue.total)}`}
            sub="From all paid orders"
            iconBg="bg-[#1a5c14]/10 text-[#1a5c14]"
          />
          <StatCard
            icon={IndianRupee}
            label="This Month Revenue"
            value={`₹${fmt(data!.revenue.thisMonth)}`}
            sub={`vs ₹${fmt(data!.revenue.lastMonth)} last month`}
            growth={data!.revenue.growth}
            iconBg="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            icon={ShoppingBag}
            label="Total Orders"
            value={fmt(data!.orders.total)}
            sub={`${fmt(data!.orders.thisMonth)} new this month`}
            iconBg="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={Users}
            label="Total Customers"
            value={fmt(data!.customers.total)}
            sub={`${fmt(data!.customers.thisMonth)} joined this month`}
            iconBg="bg-purple-50 text-purple-600"
          />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Revenue trend chart                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h2>
        {loading ? (
          <Skeleton className="h-70 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={data?.dailyRevenue ?? []}
              margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1a5c14" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1a5c14" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={abbreviateDate}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v: number) => `₹${v.toLocaleString("en-IN")}`}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="revenue"
                stroke="#1a5c14"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 5, fill: "#1a5c14", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Top Products + Orders by Status                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-bold text-gray-900">Top Products by Revenue</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-36 rounded bg-gray-100" />
                    <div className="h-3 w-24 rounded bg-gray-100" />
                  </div>
                  <div className="h-3.5 w-16 rounded bg-gray-100" />
                </div>
              ))
            ) : (data?.topProducts ?? []).length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No product sales data yet.</p>
            ) : (
              (data?.topProducts ?? []).map((p, idx) => (
                <div key={p._id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="text-xs font-bold text-gray-300 w-4 shrink-0">{idx + 1}</span>
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-10 w-10 rounded-lg object-cover shrink-0 border border-gray-100"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{fmt(p.units)} units sold</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 whitespace-nowrap shrink-0">
                    ₹{fmt(p.revenue)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-bold text-gray-900">Orders by Status</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-3.5 w-20 rounded bg-gray-100" />
                    <div className="h-3.5 w-8 rounded bg-gray-100" />
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100" />
                </div>
              ))
            ) : (data?.orders.byStatus ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No order data yet.</p>
            ) : (
              (data?.orders.byStatus ?? []).map((s) => {
                const pct = totalStatusCount > 0 ? Math.round((s.count / totalStatusCount) * 100) : 0;
                return (
                  <div key={s.status} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase",
                          STATUS_COLOR[s.status] ?? "bg-gray-100 text-gray-600"
                        )}
                      >
                        {s.status}
                      </span>
                      <span className="text-xs font-bold text-gray-600">
                        {fmt(s.count)}{" "}
                        <span className="text-gray-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          STATUS_BAR_COLOR[s.status] ?? "bg-gray-400"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Recent Orders                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Recent Orders</h2>
          <a
            href="/admin/orders"
            className="text-xs font-semibold text-[#1a5c14] hover:underline"
          >
            View All
          </a>
        </div>

        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50 text-left">
                {["Order #", "Amount", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (data?.recentOrders ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-gray-400 text-sm">
                    No recent orders.
                  </td>
                </tr>
              ) : (
                (data?.recentOrders ?? []).map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">#{o.orderNumber}</td>
                    <td className="px-5 py-4 font-bold text-gray-900">
                      ₹{o.total.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase",
                          STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600"
                        )}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{fmtDate(o.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="sm:hidden divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse space-y-1.5">
                <div className="h-4 w-32 rounded bg-gray-100" />
                <div className="h-3.5 w-24 rounded bg-gray-100" />
              </div>
            ))
          ) : (data?.recentOrders ?? []).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No recent orders.</p>
          ) : (
            (data?.recentOrders ?? []).map((o) => (
              <div key={o._id} className="flex items-center justify-between px-5 py-4 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">#{o.orderNumber}</p>
                  <p className="text-xs text-gray-400">{fmtDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                      STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600"
                    )}
                  >
                    {o.status}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    ₹{o.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
