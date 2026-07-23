"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingBag, ChevronLeft, ChevronRight, Zap, Truck, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS } from "@/constants";

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  userId?: { name: string; email: string };
  shippingAddress?: { name: string; city: string };
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

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  paid:               "bg-green-100 text-green-700",
  pending:            "bg-yellow-100 text-yellow-700",
  failed:             "bg-red-100 text-red-700",
  refunded:           "bg-gray-100 text-gray-700",
  partially_refunded: "bg-orange-100 text-orange-700",
};

function PaymentMethodBadge({ method, status }: { method: string; status: string }) {
  const methodBadge =
    method === "razorpay" ? (
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-700 w-fit">
        <Zap className="h-2.5 w-2.5" /> Razorpay
      </span>
    ) : method === "cod" ? (
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-700 w-fit">
        <Truck className="h-2.5 w-2.5" /> COD
      </span>
    ) : (
      <span className="rounded px-2 py-0.5 text-[11px] font-bold uppercase bg-gray-100 text-gray-600 w-fit">{method}</span>
    );

  return (
    <div className="flex flex-col gap-1">
      {methodBadge}
      <span className={cn("rounded px-2 py-0.5 text-[11px] font-bold uppercase w-fit", PAYMENT_STATUS_COLOR[status] ?? "bg-gray-100 text-gray-600")}>
        {status}
      </span>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders]         = useState<Order[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setFilter]   = useState("");
  const [payFilter, setPayFilter]   = useState("");
  const [loading, setLoading]       = useState(true);
  const [updatingId, setUpdating]   = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({
      page: String(page),
      ...(statusFilter && { status: statusFilter }),
      ...(payFilter    && { paymentMethod: payFilter }),
    });
    fetch(`/api/admin/orders?${q}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setOrders(json.data.orders);
          setTotal(json.data.total);
          setTotalPages(json.data.totalPages);
        }
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter, payFilter]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    load();
  }

  async function markAsPaid(id: string) {
    if (!confirm("Mark this order as Paid?")) return;
    setMarkingPaid(id);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "paid" }),
    });
    setMarkingPaid(null);
    load();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a5c14]/10 shrink-0">
          <ShoppingBag className="h-5 w-5 text-[#1a5c14]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Orders</h1>
          <p className="text-xs text-gray-500">{total} total orders</p>
        </div>
      </div>

      {/* Filters — scrollable on mobile */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <span className="text-xs font-semibold text-gray-400 self-center shrink-0">Status:</span>
          <button onClick={() => { setFilter(""); setPage(1); }}
            className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0",
              statusFilter === "" ? "bg-[#1a5c14] border-[#1a5c14] text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            )}>All</button>
          {Object.values(ORDER_STATUS).map((s) => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition-colors whitespace-nowrap shrink-0",
                statusFilter === s ? "bg-[#1a5c14] border-[#1a5c14] text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              )}>{s}</button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <span className="text-xs font-semibold text-gray-400 self-center shrink-0">Payment:</span>
          {[{ val: "", label: "All" }, { val: "razorpay", label: "Online" }, { val: "cod", label: "COD" }].map(({ val, label }) => (
            <button key={val} onClick={() => { setPayFilter(val); setPage(1); }}
              className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0",
                payFilter === val ? "bg-[#1a5c14] border-[#1a5c14] text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              )}>{label}</button>
          ))}
        </div>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-400 text-sm">No orders found.</div>
        ) : (
          orders.map((o) => (
            <div key={o._id} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">#{o.orderNumber}</p>
                  <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <span className={cn("shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase", STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600")}>
                  {o.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{o.userId?.name ?? o.shippingAddress?.name ?? "—"}</p>
                  <p className="text-xs text-gray-400">{o.userId?.email ?? ""}</p>
                </div>
                <span className="font-bold text-gray-900">₹{o.total.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between">
                <PaymentMethodBadge method={o.paymentMethod} status={o.paymentStatus} />
                <select
                  defaultValue={o.status}
                  disabled={updatingId === o._id}
                  onChange={(e) => updateStatus(o._id, e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 focus:border-[#1a5c14] focus:outline-none disabled:opacity-50"
                >
                  {Object.values(ORDER_STATUS).map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              {o.paymentStatus !== "paid" && (
                <button
                  onClick={() => markAsPaid(o._id)}
                  disabled={markingPaid === o._id}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {markingPaid === o._id ? "Saving…" : "Mark as Paid"}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                {["Order", "Customer", "Total", "Payment", "Order Status", "Update Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3.5 font-semibold text-gray-500 uppercase text-xs tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 w-full animate-pulse rounded bg-gray-100" /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No orders found.</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">#{o.orderNumber}</p>
                      <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{o.userId?.name ?? o.shippingAddress?.name ?? "—"}</p>
                      <p className="text-xs text-gray-400">{o.userId?.email ?? ""}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-900 whitespace-nowrap">₹{o.total.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-4"><PaymentMethodBadge method={o.paymentMethod} status={o.paymentStatus} /></td>
                    <td className="px-4 py-4">
                      <span className={cn("rounded px-2 py-0.5 text-[11px] font-bold uppercase", STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600")}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        defaultValue={o.status}
                        disabled={updatingId === o._id}
                        onChange={(e) => updateStatus(o._id, e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 focus:border-[#1a5c14] focus:outline-none disabled:opacity-50"
                      >
                        {Object.values(ORDER_STATUS).map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      {o.paymentStatus !== "paid" && (
                        <button
                          onClick={() => markAsPaid(o._id)}
                          disabled={markingPaid === o._id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          <BadgeCheck className="h-3.5 w-3.5" />
                          {markingPaid === o._id ? "Saving…" : "Mark as Paid"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile pagination */}
      {totalPages > 1 && (
        <div className="flex sm:hidden items-center justify-between">
          <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
