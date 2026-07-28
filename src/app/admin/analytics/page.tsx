"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, IndianRupee, ShoppingBag, Users, BarChart2,
  Calendar, Search, RefreshCw, UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RevenueData {
  total: number;
  period: number;
  prevPeriod: number;
  growth: number;
}

interface OrdersData {
  total: number;
  period: number;
  byStatus: { status: string; count: number }[];
}

interface CustomersData {
  total: number;
  period: number;
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
  customerName: string;
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

const MONTH_LIST = [
  { value: "all", label: "All Months" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const YEAR_LIST = ["2026", "2025", "2024", "all"];

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
  if (dateStr.length === 7) { // "YYYY-MM"
    const [y, m] = dateStr.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }
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

  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [searchOrder, setSearchOrder] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const q = new URLSearchParams({
        year: selectedYear,
        month: selectedMonth,
        ...(searchOrder && { search: searchOrder }),
      });
      const res = await fetch(`/api/admin/analytics?${q}`, {
        headers: {
          "x-user-role": "admin",
          "x-admin-verified": "1",
        },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, searchOrder]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const selectedPeriodLabel = useMemo(() => {
    if (selectedYear === "all" && selectedMonth === "all") return "All Time";
    const monthObj = MONTH_LIST.find((m) => m.value === selectedMonth);
    const mName = monthObj && selectedMonth !== "all" ? monthObj.label : "";
    const yName = selectedYear !== "all" ? selectedYear : "";
    return [mName, yName].filter(Boolean).join(" ");
  }, [selectedYear, selectedMonth]);

  const totalStatusCount =
    data?.orders.byStatus.reduce((acc, s) => acc + s.count, 0) ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen bg-gray-50">
      {/* Header & Year / Month Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a5c14]/10">
            <BarChart2 className="h-5 w-5 text-[#1a5c14]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Analytics</h1>
            <p className="text-xs text-gray-500">Sales performance & insights ({selectedPeriodLabel})</p>
          </div>
        </div>

        {/* Year & Month Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Year Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-[#1a5c14] shrink-0" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="all">All Years</option>
            </select>
          </div>

          {/* Month Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer"
            >
              {MONTH_LIST.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {loading && <RefreshCw className="h-3.5 w-3.5 text-gray-400 animate-spin ml-1" />}
          </div>
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
          {/* Card 1: Selected Period Revenue */}
          <StatCard
            icon={IndianRupee}
            label={`${selectedPeriodLabel} Revenue`}
            value={`₹${fmt(data!.revenue.period)}`}
            sub={`vs ₹${fmt(data!.revenue.prevPeriod)} prev period`}
            growth={data!.revenue.growth}
            iconBg="bg-emerald-50 text-emerald-600"
          />

          {/* Card 2: All-Time Total Revenue */}
          <StatCard
            icon={IndianRupee}
            label="All-Time Total Revenue"
            value={`₹${fmt(data!.revenue.total)}`}
            sub="Across all paid orders"
            iconBg="bg-[#1a5c14]/10 text-[#1a5c14]"
          />

          {/* Card 3: Selected Period Orders */}
          <StatCard
            icon={ShoppingBag}
            label={`${selectedPeriodLabel} Orders`}
            value={fmt(data!.orders.period)}
            sub={`${fmt(data!.orders.total)} all-time total orders`}
            iconBg="bg-blue-50 text-blue-600"
          />

          {/* Card 4: Selected Period Customers */}
          <StatCard
            icon={Users}
            label={`${selectedPeriodLabel} Customers`}
            value={fmt(data!.customers.period)}
            sub={`${fmt(data!.customers.total)} all-time active customers`}
            iconBg="bg-purple-50 text-purple-600"
          />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Revenue trend chart                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">
          Revenue Trend ({selectedPeriodLabel})
        </h2>
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
            <h2 className="text-sm font-bold text-gray-900">Top Products by Revenue ({selectedPeriodLabel})</h2>
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
              <p className="px-5 py-8 text-center text-sm text-gray-400">No product sales data for selected period.</p>
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
            <h2 className="text-sm font-bold text-gray-900">Orders by Status ({selectedPeriodLabel})</h2>
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
              <p className="py-8 text-center text-sm text-gray-400">No order data for selected period.</p>
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
      {/* Orders Section with Search Bar                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Orders ({selectedPeriodLabel})</h2>
            <p className="text-xs text-gray-400">Search & inspect recent orders</p>
          </div>

          {/* Search Bar for Order ID / Customer Name */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
              placeholder="Search by Order # or Customer Name..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-8 pr-3 py-2 text-xs outline-none focus:border-[#1a5c14] focus:bg-white focus:ring-1 focus:ring-[#1a5c14]"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Order #</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Customer Name</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Amount</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (data?.recentOrders ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                    No orders found matching your search/filter.
                  </td>
                </tr>
              ) : (
                (data?.recentOrders ?? []).map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 font-bold text-[#1a5c14]">#{o.orderNumber}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span>{o.customerName}</span>
                      </div>
                    </td>
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

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse space-y-1.5">
                <div className="h-4 w-32 rounded bg-gray-100" />
                <div className="h-3.5 w-24 rounded bg-gray-100" />
              </div>
            ))
          ) : (data?.recentOrders ?? []).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No orders found matching your search/filter.</p>
          ) : (
            (data?.recentOrders ?? []).map((o) => (
              <div key={o._id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#1a5c14]">#{o.orderNumber}</span>
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                      STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600"
                    )}
                  >
                    {o.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
                    <UserCheck className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="truncate max-w-[160px]">{o.customerName}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    ₹{o.total.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">{fmtDate(o.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
