"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, Mail, Phone, MapPin, ShoppingBag,
  CheckCircle, XCircle, RefreshCw, Package, ChevronRight,
  Loader2, Calendar, CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Address {
  _id: string;
  label: string;
  name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface CustomerDetail {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  addresses: Address[];
}

interface OrderLine {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  items: { name: string; quantity: number; image: string }[];
  createdAt: string;
}

interface Summary {
  totalOrders: number;
  totalSpent: number;
  cancelled: number;
  refunded: number;
  delivered: number;
}

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  confirmed:  "bg-blue-100 text-blue-700",
  packed:     "bg-indigo-100 text-indigo-700",
  shipped:    "bg-purple-100 text-purple-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
  returned:   "bg-orange-100 text-orange-700",
  refunded:   "bg-gray-100 text-gray-600",
};

const PAYMENT_STYLES: Record<string, string> = {
  paid:                 "bg-green-100 text-green-700",
  pending:              "bg-yellow-100 text-yellow-700",
  refunded:             "bg-gray-100 text-gray-600",
  partially_refunded:   "bg-orange-100 text-orange-700",
  failed:               "bg-red-100 text-red-700",
  pending_verification: "bg-amber-100 text-amber-700",
};

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer]   = useState<CustomerDetail | null>(null);
  const [orders, setOrders]       = useState<OrderLine[]>([]);
  const [summary, setSummary]     = useState<Summary | null>(null);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<"all" | "cancelled" | "refunded" | "delivered">("all");

  useEffect(() => {
    fetch(`/api/admin/customers/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setCustomer(j.data.user);
          setOrders(j.data.orders);
          setSummary(j.data.summary);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const filtered = filter === "all"
    ? orders
    : filter === "cancelled"
      ? orders.filter((o) => o.status === "cancelled")
      : filter === "refunded"
        ? orders.filter((o) => o.status === "refunded" || o.paymentStatus === "refunded")
        : orders.filter((o) => o.status === "delivered");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a5c14]" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>Customer not found.</p>
        <Link href="/admin/customers" className="mt-4 inline-flex items-center gap-1 text-sm text-[#1a5c14] hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Back */}
      <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a5c14]/10 shrink-0">
            <User className="h-7 w-7 text-[#1a5c14]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">{customer.name}</h1>
            <p className="text-sm text-gray-500">{customer.email}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className={cn("rounded-lg px-2.5 py-1 text-xs font-bold uppercase", customer.isEmailVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
            {customer.isEmailVerified ? "Email Verified" : "Unverified"}
          </span>
          <span className={cn("rounded-lg px-2.5 py-1 text-xs font-bold uppercase", customer.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
            {customer.isActive ? "Active" : "Blocked"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── LEFT: Contact + Addresses ────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-1">

          {/* Contact info */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Contact</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5 text-gray-600">
                <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                <span>{customer.phone ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                <span>Joined {fmtDate(customer.createdAt)}</span>
              </div>
              {customer.lastLoginAt && (
                <div className="flex items-center gap-2.5 text-gray-600">
                  <CheckCircle className="h-4 w-4 shrink-0 text-gray-400" />
                  <span>Last login {fmtDate(customer.lastLoginAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Saved Addresses</h2>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-gray-400">No saved addresses.</p>
            ) : (
              <div className="space-y-3">
                {customer.addresses.map((addr) => (
                  <div key={addr._id} className={cn("rounded-xl border p-3.5 text-sm", addr.isDefault ? "border-[#1a5c14]/30 bg-[#1a5c14]/3" : "border-gray-100")}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-800">{addr.name}</span>
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-500">{addr.label}</span>
                      {addr.isDefault && <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-[#1a5c14]/10 text-[#1a5c14]">Default</span>}
                    </div>
                    <p className="text-gray-600 leading-snug pl-5">
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
                      {addr.city}, {addr.state} – {addr.pincode}
                    </p>
                    {addr.phone && <p className="text-gray-400 text-xs pl-5 mt-1">{addr.phone}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Stats + Orders ─────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Orders",  value: summary.totalOrders, icon: ShoppingBag, color: "text-blue-600",   bg: "bg-blue-50"   },
                { label: "Total Spent",   value: fmt(summary.totalSpent), icon: CreditCard,  color: "text-green-700", bg: "bg-green-50"  },
                { label: "Cancelled",     value: summary.cancelled,   icon: XCircle,      color: "text-red-600",   bg: "bg-red-50"    },
                { label: "Refunded",      value: summary.refunded,    icon: RefreshCw,    color: "text-gray-600",  bg: "bg-gray-100"  },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl mb-3", bg)}>
                    <Icon className={cn("h-4 w-4", color)} />
                  </div>
                  <p className="text-xl font-black text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Order filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "delivered", "cancelled", "refunded"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors capitalize",
                  filter === f ? "bg-[#1a5c14] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {f === "all" ? `All Orders (${orders.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Orders list */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
                No {filter === "all" ? "" : filter} orders.
              </div>
            ) : (
              filtered.map((order) => (
                <div key={order._id} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900 text-sm font-mono">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(order.createdAt)}</p>
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      <span className={cn("rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase", STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600")}>
                        {order.status}
                      </span>
                      <span className={cn("rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase", PAYMENT_STYLES[order.paymentStatus] ?? "bg-gray-100 text-gray-600")}>
                        {order.paymentStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {order.items.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {item.image && <img src={item.image} alt={item.name} className="h-6 w-6 rounded object-cover" />}
                        <span className="text-xs text-gray-700 max-w-[120px] truncate">{item.name}</span>
                        <span className="text-[10px] font-bold text-gray-400">×{item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <span className="text-xs text-gray-400 shrink-0">+{order.items.length - 4} more</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                    <span className="text-sm font-black text-gray-900">{fmt(order.total)}</span>
                    <Link
                      href={`/admin/orders?search=${order.orderNumber}`}
                      className="flex items-center gap-1 text-xs font-semibold text-[#1a5c14] hover:underline"
                    >
                      View Order <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
