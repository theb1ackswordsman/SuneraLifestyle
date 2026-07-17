"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IndianRupee, ShoppingBag, Package, Users,
  TrendingUp, Clock, ExternalLink,
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
  pending:   "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed:    "bg-indigo-100 text-indigo-700",
  shipped:   "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  returned:  "bg-orange-100 text-orange-700",
  refunded:  "bg-gray-100 text-gray-700",
};

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 flex items-start gap-4 shadow-sm">
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="mt-1 text-2xl font-black text-gray-900 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<StatusCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setStats(json.data.stats);
          setRecentOrders(json.data.recentOrders);
          setOrdersByStatus(json.data.ordersByStatus);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, Admin. Here&apos;s what&apos;s happening.</p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 text-sm font-semibold text-[#1a5c14] hover:underline"
        >
          View Store <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={IndianRupee}
            label="Total Revenue"
            value={`₹${fmt(stats?.totalRevenue ?? 0)}`}
            sub="From paid orders"
            color="bg-[#1a5c14]/10 text-[#1a5c14]"
          />
          <StatCard
            icon={ShoppingBag}
            label="Total Orders"
            value={fmt(stats?.totalOrders ?? 0)}
            sub="All time"
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
            sub="Registered accounts"
            color="bg-orange-50 text-orange-600"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-900">Recent Orders</h2>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-[#1a5c14] hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-3.5 animate-pulse">
                  <div className="h-4 w-3/4 rounded bg-gray-100" />
                </div>
              ))
            ) : recentOrders.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">No orders yet.</p>
            ) : (
              recentOrders.map((o) => (
                <div key={o._id} className="flex items-center justify-between px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">#{o.orderNumber}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase", STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600")}>
                      {o.status}
                    </span>
                    <span className="text-sm font-bold text-gray-900">₹{fmt(o.total)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900">Orders by Status</h2>
          </div>
          <div className="p-6 space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-gray-100" />
              ))
            ) : ordersByStatus.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No data yet.</p>
            ) : (
              ordersByStatus.map((s) => (
                <div key={s._id} className="flex items-center justify-between">
                  <span className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase", STATUS_COLOR[s._id] ?? "bg-gray-100 text-gray-600")}>
                    {s._id}
                  </span>
                  <span className="text-sm font-bold text-gray-700">{s.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Add Product",   href: "/admin/products/new",   color: "bg-[#1a5c14] text-white hover:bg-[#103a0c]" },
            { label: "View Orders",   href: "/admin/orders",          color: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50" },
            { label: "See Customers", href: "/admin/customers",       color: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50" },
            { label: "Manage Coupons",href: "/admin/coupons",         color: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50" },
          ].map(({ label, href, color }) => (
            <Link key={href} href={href} className={cn("rounded-lg px-4 py-2 text-sm font-semibold transition-colors", color)}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
