"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  IndianRupee, ShoppingBag, Package, Users,
  TrendingUp, Clock, ExternalLink, Calendar, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface StatusCount {
  _id: string;
  count: number;
}

const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  packed:    "bg-indigo-100 text-indigo-700 border-indigo-200",
  shipped:   "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  returned:  "bg-orange-100 text-orange-700 border-orange-200",
  refunded:  "bg-gray-100 text-gray-700 border-gray-200",
};

const MONTH_LIST = [
  { value: "all", label: "All Months" },
  { value: "01",  label: "January" },
  { value: "02",  label: "February" },
  { value: "03",  label: "March" },
  { value: "04",  label: "April" },
  { value: "05",  label: "May" },
  { value: "06",  label: "June" },
  { value: "07",  label: "July" },
  { value: "08",  label: "August" },
  { value: "09",  label: "September" },
  { value: "10",  label: "October" },
  { value: "11",  label: "November" },
  { value: "12",  label: "December" },
];

const YEAR_LIST = ["2026", "2025", "2024", "all"];

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-5 flex items-center gap-3 shadow-sm">
      <div className={cn("flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl", color)}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">{label}</p>
        <p className="mt-0.5 text-base sm:text-2xl font-black text-gray-900 leading-tight break-all">{value}</p>
        {sub && <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats,          setStats]          = useState<Stats | null>(null);
  const [recentOrders,   setRecentOrders]   = useState<RecentOrder[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<StatusCount[]>([]);
  const [loading,        setLoading]        = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear,  setSelectedYear]  = useState<string>("2026");

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: selectedMonth,
        year:  selectedYear,
      });
      const r = await fetch(`/api/admin/stats?${params}`);
      const json = await r.json();
      if (json.success) {
        setStats(json.data.stats);
        setRecentOrders(json.data.recentOrders ?? []);
        setOrdersByStatus(json.data.ordersByStatus ?? []);
      }
    } catch (e) {
      console.error("Failed to load dashboard stats", e);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  const activeMonthLabel = MONTH_LIST.find((m) => m.value === selectedMonth)?.label ?? "All Months";
  const activeYearLabel  = selectedYear === "all" ? "All Years" : selectedYear;

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-8">
      {/* Header & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Showing metrics for <span className="font-semibold text-[#1a5c14]">{activeMonthLabel} {activeYearLabel}</span>
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap max-w-full">
          <div className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-gray-200 bg-white p-1 shadow-2xs max-w-full overflow-x-auto">
            <div className="flex items-center gap-1 pl-2 text-gray-400 shrink-0">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>

            {/* Month Dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg bg-transparent py-1 pl-1 pr-1.5 text-xs font-semibold text-gray-800 focus:outline-none cursor-pointer shrink-0"
            >
              {MONTH_LIST.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <span className="text-gray-200 shrink-0">|</span>

            {/* Year Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg bg-transparent py-1 pl-1 pr-1.5 text-xs font-semibold text-gray-800 focus:outline-none cursor-pointer shrink-0"
            >
              {YEAR_LIST.map((y) => (
                <option key={y} value={y}>
                  {y === "all" ? "All Years" : y}
                </option>
              ))}
            </select>
          </div>

          {(selectedMonth !== "all" || selectedYear !== "all") && (
            <button
              onClick={() => { setSelectedMonth("all"); setSelectedYear("all"); }}
              className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
            >
              Reset
            </button>
          )}

          <button
            onClick={loadStats}
            className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
            title="Refresh Stats"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", loading && "animate-spin text-[#1a5c14]")} />
          </button>

          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#1a5c14] hover:underline ml-1"
          >
            View Store <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Add Product",    href: "/admin/products/new", color: "bg-[#1a5c14] text-white hover:bg-[#103a0c]" },
          { label: "View Orders",    href: "/admin/orders",        color: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50" },
          { label: "See Customers",  href: "/admin/customers",     color: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50" },
          { label: "Manage Coupons", href: "/admin/coupons",       color: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50" },
        ].map(({ label, href, color }) => (
          <Link key={href} href={href} className={cn("rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold transition-colors", color)}>
            {label}
          </Link>
        ))}
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 sm:h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard
            icon={IndianRupee}
            label="Total Revenue"
            value={`₹${fmt(stats?.totalRevenue ?? 0)}`}
            sub={selectedMonth !== "all" || selectedYear !== "all" ? `${activeMonthLabel} ${activeYearLabel}` : "Paid orders"}
            color="bg-[#1a5c14]/10 text-[#1a5c14]"
          />
          <StatCard
            icon={ShoppingBag}
            label="Total Orders"
            value={fmt(stats?.totalOrders ?? 0)}
            sub={selectedMonth !== "all" || selectedYear !== "all" ? `${activeMonthLabel} ${activeYearLabel}` : "All orders"}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={Package}
            label="Products"
            value={fmt(stats?.totalProducts ?? 0)}
            sub="Active listings"
            color="bg-purple-50 text-purple-600"
          />
          <StatCard
            icon={Users}
            label="Customers"
            value={fmt(stats?.totalCustomers ?? 0)}
            sub={selectedMonth !== "all" || selectedYear !== "all" ? `${activeMonthLabel} ${activeYearLabel}` : "Registered"}
            color="bg-orange-50 text-orange-600"
          />
        </div>
      )}

      {/* Main Grid: Recent Orders & Orders by Status */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-3.5 sm:px-6 py-3.5">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="h-4 w-4 text-[#1a5c14] shrink-0" />
              <h2 className="text-sm font-black text-gray-900 truncate">Recent Orders</h2>
              {(selectedMonth !== "all" || selectedYear !== "all") && (
                <span className="rounded-full bg-[#1a5c14]/10 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-[#1a5c14] shrink-0">
                  {activeMonthLabel} {activeYearLabel}
                </span>
              )}
            </div>
            <Link href="/admin/orders" className="text-xs font-bold text-[#1a5c14] hover:underline shrink-0">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-3.5 sm:px-6 py-3 animate-pulse">
                  <div className="h-4 w-3/4 rounded bg-gray-100" />
                </div>
              ))
            ) : recentOrders.length === 0 ? (
              <p className="px-3.5 sm:px-6 py-8 text-center text-xs text-gray-400 italic">
                No orders found for {activeMonthLabel} {activeYearLabel}.
              </p>
            ) : (
              recentOrders.map((o) => (
                <div key={o._id} className="flex items-center justify-between gap-2 px-3.5 sm:px-6 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">#{o.orderNumber}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className={cn("px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase border whitespace-nowrap", STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
                      {o.status}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-gray-900">₹{fmt(o.total)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3.5 sm:px-6 py-3.5">
            <TrendingUp className="h-4 w-4 text-[#1a5c14] shrink-0" />
            <h2 className="text-sm font-black text-gray-900">Orders by Status</h2>
          </div>
          <div className="p-3.5 sm:p-6 space-y-2.5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-gray-100" />
              ))
            ) : ordersByStatus.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6 italic">No orders found for this period.</p>
            ) : (
              ordersByStatus.map((s) => (
                <div key={s._id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <span className={cn("px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase border whitespace-nowrap", STATUS_COLOR[s._id] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
                    {s._id}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-gray-800">{s.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
