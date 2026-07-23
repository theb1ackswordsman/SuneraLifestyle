"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShoppingBag, ChevronLeft, ChevronRight, Zap, Truck, BadgeCheck,
  Eye, X, MapPin, CreditCard, Clock, Check, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS } from "@/constants";

interface OrderItem {
  _id: string;
  name: string;
  image: string;
  slug: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  shippingFee: number;
  couponCode?: string;
  couponDiscount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  userId?: { name: string; email: string };
  shippingAddress?: { name: string; phone?: string; addressLine1: string; addressLine2?: string; city: string; state: string; pincode: string };
  items: OrderItem[];
  timeline?: { status: string; message: string; timestamp: string }[];
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

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function fmtPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

// ─── Order Detail Drawer ──────────────────────────────────────────────────────

function OrderDrawer({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}`)
      .then((r) => r.json())
      .then((j) => setOrder(j.data?.order ?? null))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <p className="font-black text-gray-900">{order ? `#${order.orderNumber}` : "Order Details"}</p>
            {order && <p className="text-xs text-gray-400">{fmt(order.createdAt)}</p>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-[#1a5c14] border-t-transparent animate-spin" />
          </div>
        ) : !order ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Order not found.</div>
        ) : (
          <div className="flex-1 p-5 space-y-6">

            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <span className={cn("rounded-lg px-3 py-1 text-xs font-bold uppercase", STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-600")}>
                {order.status}
              </span>
              <span className={cn("rounded-lg px-3 py-1 text-xs font-bold uppercase", PAYMENT_STATUS_COLOR[order.paymentStatus] ?? "bg-gray-100 text-gray-600")}>
                Payment: {order.paymentStatus}
              </span>
              <span className="rounded-lg px-3 py-1 text-xs font-bold uppercase bg-gray-100 text-gray-600">
                {order.paymentMethod === "razorpay" ? "Razorpay" : order.paymentMethod.toUpperCase()}
              </span>
            </div>

            {/* Customer */}
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Customer</p>
              <p className="font-semibold text-gray-900">{order.userId?.name ?? order.shippingAddress?.name ?? "—"}</p>
              {order.userId?.email && <p className="text-xs text-gray-500 mt-0.5">{order.userId.email}</p>}
            </div>

            {/* Items — each in its own row */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Items</p>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                      {item.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center"><Package className="h-4 w-4 text-gray-300" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 shrink-0">{fmtPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="font-medium text-gray-900">{fmtPrice(order.subtotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Shipping</span><span className="font-medium text-gray-900">{order.shippingFee > 0 ? fmtPrice(order.shippingFee) : "FREE"}</span></div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-green-700"><span>Coupon {order.couponCode ? `(${order.couponCode})` : ""}</span><span className="font-semibold">−{fmtPrice(order.couponDiscount)}</span></div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900"><span>Total</span><span>{fmtPrice(order.total)}</span></div>
            </div>

            {/* Shipping address */}
            {order.shippingAddress && (
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Delivery Address</p>
                </div>
                <p className="font-semibold text-gray-900">{order.shippingAddress.name}</p>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">
                  {order.shippingAddress.addressLine1}
                  {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}
                </p>
                {order.shippingAddress.phone && <p className="text-xs text-gray-400 mt-1">{order.shippingAddress.phone}</p>}
              </div>
            )}

            {/* Timeline */}
            {order.timeline && order.timeline.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Activity</p>
                <div className="space-y-0">
                  {[...order.timeline].reverse().map((t, i) => {
                    const isLatest = i === 0;
                    const isLast   = i === (order.timeline?.length ?? 0) - 1;
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          {isLatest
                            ? <div className="h-3 w-3 rounded-full bg-[#1a5c14] mt-1 shrink-0" />
                            : <div className="h-2.5 w-2.5 rounded-full bg-[#1a5c14]/40 mt-1.5 shrink-0" />
                          }
                          {!isLast && <div className="w-px flex-1 bg-[#1a5c14]/20 my-1.5" />}
                        </div>
                        <div className="pb-4 min-w-0">
                          <p className={cn("text-sm font-semibold capitalize", isLatest ? "text-[#1a5c14]" : "text-gray-700")}>
                            {t.status.replace(/_/g, " ")}
                          </p>
                          {t.message && <p className="text-xs text-gray-400 mt-0.5">{t.message}</p>}
                          <p className="text-[11px] text-gray-300 mt-1">{fmt(t.timestamp)} · {fmtTime(t.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Estimated delivery */}
            {order.estimatedDelivery && (
              <div className="rounded-xl bg-[#1a5c14]/5 border border-[#1a5c14]/20 px-4 py-3 flex items-center gap-3">
                <Clock className="h-4 w-4 text-[#1a5c14] shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#1a5c14]">Estimated Delivery</p>
                  <p className="text-sm font-bold text-gray-900">{fmt(order.estimatedDelivery)}</p>
                </div>
                {order.trackingNumber && (
                  <div className="ml-auto text-right">
                    <p className="text-xs text-gray-400">Tracking</p>
                    <p className="text-xs font-mono font-bold text-gray-700">{order.trackingNumber}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);

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

      {/* Filters */}
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

      {/* Order cards */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100" />
          ))
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-400 text-sm">No orders found.</div>
        ) : (
          orders.map((o) => (
            <div key={o._id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">

              {/* Order header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">#{o.orderNumber}</p>
                    <p className="text-xs text-gray-400">{fmt(o.createdAt)}</p>
                  </div>
                  <span className={cn("rounded px-2 py-0.5 text-[11px] font-bold uppercase", STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600")}>
                    {o.status}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {o.paymentMethod === "razorpay" ? (
                      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-700">
                        <Zap className="h-2.5 w-2.5" /> Razorpay
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-700">
                        <Truck className="h-2.5 w-2.5" /> COD
                      </span>
                    )}
                    <span className={cn("rounded px-2 py-0.5 text-[11px] font-bold uppercase", PAYMENT_STATUS_COLOR[o.paymentStatus] ?? "bg-gray-100 text-gray-600")}>
                      {o.paymentStatus}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{o.userId?.name ?? o.shippingAddress?.name ?? "—"}</p>
                    <p className="text-xs text-gray-300">{o.userId?.email ?? ""}</p>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{fmtPrice(o.total)}</p>
                </div>
              </div>

              {/* Items — one row each */}
              <div className="divide-y divide-gray-50">
                {(o.items ?? []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center"><ShoppingBag className="h-3.5 w-3.5 text-gray-300" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity} · {fmtPrice(item.price)} each</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 shrink-0">{fmtPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Actions footer */}
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/40">
                {/* View button */}
                <button
                  onClick={() => setDrawerOrderId(o._id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </button>

                {/* Update status */}
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

                {/* Cash received (COD only) */}
                {o.paymentStatus !== "paid" && o.paymentMethod === "cod" && (
                  <button
                    onClick={() => markAsPaid(o._id)}
                    disabled={markingPaid === o._id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {markingPaid === o._id ? "Saving…" : "Cash Received"}
                  </button>
                )}

                {/* Paid indicator */}
                {o.paymentStatus === "paid" && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                    <Check className="h-3.5 w-3.5" /> Paid
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {drawerOrderId && (
        <OrderDrawer orderId={drawerOrderId} onClose={() => setDrawerOrderId(null)} />
      )}
    </div>
  );
}
