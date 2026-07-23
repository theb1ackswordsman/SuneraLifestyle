"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Package, ShoppingBag, ChevronDown, ChevronRight,
  Check, Truck, MapPin, CreditCard, ExternalLink, Clock, AlertCircle,
  RotateCcw, X, Upload, Loader2,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem { _id: string; name: string; image: string; slug: string; price: number; quantity: number }

interface Order {
  _id: string; orderNumber: string; status: string; paymentStatus: string;
  paymentMethod: string; subtotal: number; shippingFee: number;
  couponCode?: string; couponDiscount: number; total: number;
  estimatedDelivery: string | null; trackingNumber: string | null;
  trackingUrl: string | null; createdAt: string;
  timeline: { status: string; message: string; timestamp: string }[];
  items: OrderItem[];
  shippingAddress: { name: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state: string; pincode: string };
}

interface ReturnDoc {
  _id: string;
  orderId: string;
  status: string;
  returnNumber: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RETURN_WINDOW_DAYS = 7;

const STATUS_STEPS = [
  { key: "pending",   label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packed",    label: "Packed" },
  { key: "shipped",   label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];
const STEP_INDEX: Record<string, number> = {
  pending: 0, confirmed: 1, packed: 2, shipped: 3, delivered: 4,
};

const STATUS_BADGE: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  packed:    "bg-indigo-100 text-indigo-700 border-indigo-200",
  shipped:   "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  returned:  "bg-orange-100 text-orange-700 border-orange-200",
  refunded:  "bg-gray-100 text-gray-600 border-gray-200",
};

const RETURN_STATUS_BADGE: Record<string, string> = {
  requested:         "bg-yellow-100 text-yellow-700",
  under_review:      "bg-blue-100 text-blue-700",
  approved:          "bg-green-100 text-green-700",
  rejected:          "bg-red-100 text-red-700",
  refund_processing: "bg-purple-100 text-purple-700",
  refund_completed:  "bg-emerald-100 text-emerald-700",
};

const RETURN_STATUS_LABEL: Record<string, string> = {
  requested: "Return Requested", under_review: "Under Review", approved: "Return Approved",
  rejected: "Return Rejected", refund_processing: "Refund Processing", refund_completed: "Refund Completed",
};

const RETURN_REASONS = [
  { value: "wrong_size",        label: "Wrong Size" },
  { value: "wrong_color",       label: "Wrong Color" },
  { value: "damaged_product",   label: "Damaged Product" },
  { value: "defective_product", label: "Defective Product" },
  { value: "wrong_item",        label: "Wrong Item Received" },
  { value: "missing_items",     label: "Missing Items" },
  { value: "quality_issue",     label: "Quality Issue" },
  { value: "no_longer_needed",  label: "No Longer Needed" },
  { value: "other",             label: "Other" },
];

const FILTER_TABS = ["All", "Processing", "Shipped", "Delivered", "Cancelled"] as const;
type FilterTab = typeof FILTER_TABS[number];

const TAB_TO_STATUSES: Record<FilterTab, string[]> = {
  All:        [],
  Processing: ["pending", "confirmed", "packed"],
  Shipped:    ["shipped"],
  Delivered:  ["delivered"],
  Cancelled:  ["cancelled", "returned", "refunded"],
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function getReturnWindowExpiry(order: Order): Date | null {
  const deliveredEntry = [...order.timeline].reverse().find((t) => t.status === "delivered");
  const deliveredAt = deliveredEntry ? new Date(deliveredEntry.timestamp) : null;
  if (!deliveredAt) return null;
  return new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * 86_400_000);
}

// ─── Return Modal ─────────────────────────────────────────────────────────────

function ReturnModal({
  order, onClose, onSuccess,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: (returnDoc: ReturnDoc) => void;
}) {
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(() => new Set(order.items.map((i) => i._id)));
  const [reason,       setReason]       = useState("");
  const [description,  setDescription]  = useState("");
  const [uploading,    setUploading]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [imageFiles,   setImageFiles]   = useState<File[]>([]);
  const [imagePrev,    setImagePrev]    = useState<string[]>([]);
  const [error,        setError]        = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  const selectedItems  = order.items.filter((i) => selectedIds.has(i._id));
  const estimatedTotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  function pickImages(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5);
    setImageFiles((p) => [...p, ...arr].slice(0, 5));
    arr.forEach((f) => {
      const r = new FileReader();
      r.onload = (e) => setImagePrev((p) => [...p, String(e.target?.result ?? "")].slice(0, 5));
      r.readAsDataURL(f);
    });
  }

  function removeImage(i: number) {
    setImageFiles((p) => p.filter((_, idx) => idx !== i));
    setImagePrev((p) => p.filter((_, idx) => idx !== i));
  }

  async function uploadImages(): Promise<string[]> {
    const urls: string[] = [];
    for (const file of imageFiles) {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) urls.push(json.url);
    }
    return urls;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0) { setError("Please select at least one item to return."); return; }
    if (!reason) { setError("Please select a return reason."); return; }
    setError(""); setSubmitting(true);

    try {
      setUploading(imageFiles.length > 0);
      const images = imageFiles.length > 0 ? await uploadImages() : [];
      setUploading(false);

      const items = selectedItems.map((i) => ({ _id: i._id, quantity: i.quantity }));

      const res  = await fetch("/api/returns", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ orderId: order._id, items, reason, description, images }),
      });
      const json = await res.json();

      if (json.success) {
        onSuccess(json.data);
        onClose();
      } else {
        setError(json.error ?? "Failed to submit return request.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false); setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl bg-background border border-border shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-500" />
            <h2 className="font-bold text-foreground">Request Return</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Order summary */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs text-muted-foreground">Order <span className="font-mono font-bold text-foreground">{order.orderNumber}</span></p>
        </div>

        <form onSubmit={submit} className="p-5 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Item selection */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Select Items to Return <span className="text-red-500">*</span>
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">({selectedIds.size} of {order.items.length} selected)</span>
            </label>
            <div className="space-y-2">
              {order.items.map((item) => {
                const checked = selectedIds.has(item._id);
                return (
                  <label key={item._id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors",
                      checked ? "border-[#1a5c14]/40 bg-[#1a5c14]/5" : "border-border bg-background hover:bg-muted/40"
                    )}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(item._id)}
                      className="h-4 w-4 shrink-0 rounded accent-[#1a5c14] cursor-pointer"
                    />
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center"><ShoppingBag className="h-4 w-4 text-muted-foreground/30" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} · {formatPrice(item.price)} each</p>
                    </div>
                    <p className="text-sm font-bold shrink-0">{formatPrice(item.price * item.quantity)}</p>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Return Reason <span className="text-red-500">*</span></label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
            >
              <option value="">Select a reason…</option>
              {RETURN_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail…"
              rows={3}
              maxLength={1000}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Product Images <span className="text-muted-foreground font-normal">(optional, max 5)</span></label>
            {imagePrev.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {imagePrev.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-16 w-16 rounded-xl object-cover border border-border" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {imagePrev.length < 5 && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground hover:bg-muted/60 transition-colors w-full justify-center">
                <Upload className="h-4 w-4" />
                {imagePrev.length === 0 ? "Upload images" : "Add more"}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
              onChange={(e) => pickImages(e.target.files)} />
          </div>

          {/* Estimated refund + return window notice */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-700 font-medium">Estimated Refund</span>
              <span className="font-bold text-amber-900">{selectedIds.size > 0 ? formatPrice(estimatedTotal) : "—"}</span>
            </div>
            <p className="text-xs text-amber-600">
              ⏰ Returns accepted within <strong>{RETURN_WINDOW_DAYS} days</strong> of delivery. Final refund amount is confirmed after admin review.
            </p>
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting || !reason || selectedIds.size === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a5c14] py-3 text-sm font-semibold text-white hover:bg-[#15490f] transition-colors disabled:opacity-60">
            {(submitting || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? "Uploading images…" : submitting ? "Submitting…" : `Submit Return Request${selectedIds.size > 0 && selectedIds.size < order.items.length ? ` (${selectedIds.size} item${selectedIds.size !== 1 ? "s" : ""})` : ""}`}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Tracking stepper ─────────────────────────────────────────────────────────

function TrackingStepper({ status }: { status: string }) {
  if (status === "cancelled" || status === "returned" || status === "refunded") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span className="font-semibold capitalize">{status}</span>
        <span className="text-red-500">— this order has been {status}.</span>
      </div>
    );
  }

  const currentIdx = STEP_INDEX[status] ?? 0;

  return (
    <div className="relative">
      <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100 z-0" />
      <div
        className="absolute top-5 left-5 h-0.5 bg-[#1a5c14] z-0 transition-all duration-500"
        style={{ width: currentIdx === 0 ? "0%" : `${(currentIdx / (STATUS_STEPS.length - 1)) * (100 - (100 / STATUS_STEPS.length))}%` }}
      />
      <div className="relative z-10 flex justify-between">
        {STATUS_STEPS.map((step, i) => {
          const done    = i <= currentIdx;
          const current = i === currentIdx;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                done ? "bg-[#1a5c14] border-[#1a5c14] text-white" : "bg-white border-gray-200 text-gray-300",
                current && "shadow-md shadow-[#1a5c14]/20 ring-4 ring-[#1a5c14]/10"
              )}>
                {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <span className="text-xs font-bold">{i + 1}</span>}
              </div>
              <span className={cn("text-[10px] font-semibold text-center leading-tight",
                done ? "text-[#1a5c14]" : "text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CANCELLABLE_STATUSES = ["pending", "confirmed", "packed"];

// ─── Cancel Confirm Modal ─────────────────────────────────────────────────────

function CancelModal({
  orderNumber, onClose, onConfirm, cancelling, error,
}: {
  orderNumber: string;
  onClose: () => void;
  onConfirm: () => void;
  cancelling: boolean;
  error: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl bg-background border border-border shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-bold text-foreground">Cancel Order?</p>
            <p className="text-xs text-muted-foreground font-mono">{orderNumber}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          This action cannot be undone. Your order will be cancelled and our team will be notified.
        </p>
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} disabled={cancelling}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50">
            Keep Order
          </button>
          <button onClick={onConfirm} disabled={cancelling}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
            {cancelling ? "Cancelling…" : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({
  order, returnDoc, onReturnClick, onCancelled,
}: {
  order: Order;
  returnDoc?: ReturnDoc;
  onReturnClick: (order: Order) => void;
  onCancelled: (orderId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const badgeCls = STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600 border-gray-200";

  const returnWindowExpiry = getReturnWindowExpiry(order);
  const withinWindow       = returnWindowExpiry ? Date.now() < returnWindowExpiry.getTime() : false;
  const canReturn          = order.status === "delivered" && withinWindow && !returnDoc;
  const canCancel          = CANCELLABLE_STATUSES.includes(order.status);

  async function handleCancel() {
    setCancelling(true);
    setCancelError("");
    try {
      const res  = await fetch(`/api/orders/${order._id}/cancel`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setShowCancelModal(false);
        onCancelled(order._id);
      } else {
        setCancelError(json.error ?? "Failed to cancel order.");
      }
    } catch {
      setCancelError("Something went wrong. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
    <div className="rounded-2xl border border-border bg-background overflow-hidden transition-shadow hover:shadow-sm">
      {/* Header — order number + status + toggle */}
      <button className="w-full text-left px-5 pt-4 pb-3 flex items-center justify-between gap-2" onClick={() => setOpen((p) => !p)}>
        <div>
          <p className="font-mono text-sm font-bold text-foreground">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(order.createdAt)} · {formatPrice(order.total)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase", badgeCls)}>
            {order.status}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {/* Items list — always visible, one row per item */}
      <div className="border-t border-border divide-y divide-border">
        {order.items.map((item, idx) => (
          <Link key={idx} href={`/product/${item.slug}`}
            className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center"><ShoppingBag className="h-4 w-4 text-muted-foreground/30" /></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
            </div>
            <p className="text-sm font-bold shrink-0">{formatPrice(item.price * item.quantity)}</p>
          </Link>
        ))}
      </div>

      {/* Return status chip */}
      {returnDoc && (
        <div className="px-5 pb-3">
          <Link href={`/account/returns/${returnDoc._id}`}
            className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold", RETURN_STATUS_BADGE[returnDoc.status] ?? "bg-gray-100 text-gray-600")}>
            <RotateCcw className="h-3 w-3" />
            {RETURN_STATUS_LABEL[returnDoc.status] ?? returnDoc.status}
          </Link>
        </div>
      )}

      {/* Expandable detail */}
      {open && (
        <div className="border-t border-border px-5 pb-5 space-y-6">

          {/* Tracking stepper */}
          <div className="pt-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Order Tracking</p>
            <TrackingStepper status={order.status} />
          </div>

          {/* Delivery info */}
          {order.estimatedDelivery && order.status !== "delivered" && order.status !== "cancelled" && (
            <div className="rounded-xl bg-[#1a5c14]/5 border border-[#1a5c14]/20 px-4 py-3 flex items-center gap-3">
              <Truck className="h-5 w-5 text-[#1a5c14] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#1a5c14]">Expected Delivery</p>
                <p className="text-sm font-bold text-foreground">{fmtDateLong(order.estimatedDelivery)}</p>
              </div>
              {order.trackingNumber && order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-xs font-semibold text-[#1a5c14] hover:underline">
                  Track <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {/* Cancel section — for pre-shipment orders */}
          {canCancel && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Need to cancel?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You can cancel this order as it hasn&apos;t been shipped yet.
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowCancelModal(true); }}
                className="shrink-0 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Cancel Order
              </button>
            </div>
          )}

          {/* Return section — for delivered orders */}
          {order.status === "delivered" && (
            <div>
              {canReturn ? (
                <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 flex items-start gap-3">
                  <RotateCcw className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Not satisfied with your order?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Return window expires {returnWindowExpiry ? fmtDate(returnWindowExpiry.toISOString()) : "soon"}.
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onReturnClick(order); }}
                    className="shrink-0 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
                  >
                    Return Order
                  </button>
                </div>
              ) : returnDoc ? (
                <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
                  <RotateCcw className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Return request submitted</p>
                    <p className="text-sm font-semibold">{returnDoc.returnNumber}</p>
                  </div>
                  <Link href={`/account/returns/${returnDoc._id}`} onClick={(e) => e.stopPropagation()}
                    className="shrink-0 flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors">
                    Track <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-xs text-muted-foreground">
                  Return window has expired for this order.
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          {order.timeline.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Activity</p>
              <div className="space-y-0">
                {[...order.timeline].reverse().map((t, i) => {
                  const isLatest = i === 0;
                  const isLast   = i === order.timeline.length - 1;
                  return (
                    <div key={i} className="flex gap-3">
                      {/* Dot + connector */}
                      <div className="flex flex-col items-center">
                        {isLatest ? (
                          <div className="relative mt-1 shrink-0">
                            <div className="h-3 w-3 rounded-full bg-[#1a5c14]" />
                            <div className="absolute inset-0 rounded-full bg-[#1a5c14]/30 scale-[2] animate-ping" style={{ animationDuration: "2s" }} />
                          </div>
                        ) : (
                          <div className="h-2.5 w-2.5 rounded-full bg-[#1a5c14] mt-1.5 shrink-0" />
                        )}
                        {!isLast && (
                          <div className="w-px flex-1 bg-[#1a5c14]/30 my-1.5" />
                        )}
                      </div>
                      {/* Content */}
                      <div className={cn("pb-4 min-w-0", isLatest && "pb-3")}>
                        <p className={cn(
                          "text-sm font-semibold capitalize",
                          isLatest ? "text-[#1a5c14]" : "text-foreground"
                        )}>
                          {t.status.replace(/_/g, " ")}
                          {isLatest && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-[#1a5c14]/10 px-2 py-0.5 text-[10px] font-bold text-[#1a5c14]">
                              Latest
                            </span>
                          )}
                        </p>
                        {t.message && <p className="text-xs text-muted-foreground mt-0.5">{t.message}</p>}
                        <p className="text-[11px] text-muted-foreground/60 mt-1">{fmtDate(t.timestamp)} · {fmtTime(t.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price breakdown */}
          <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span className="font-medium text-foreground">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="font-medium text-foreground">{order.shippingFee > 0 ? formatPrice(order.shippingFee) : "FREE"}</span>
            </div>
            {order.couponDiscount > 0 && (
              <div className="flex justify-between text-[#1a5c14]">
                <span>Coupon {order.couponCode ? `(${order.couponCode})` : ""}</span>
                <span className="font-semibold">−{formatPrice(order.couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground">
              <span>Total</span><span>{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Address + Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivery Address</p>
              </div>
              <p className="font-semibold text-foreground">{order.shippingAddress.name}</p>
              <p className="text-muted-foreground text-xs leading-relaxed mt-1">
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}
              </p>
              {order.shippingAddress.phone && <p className="text-xs text-muted-foreground mt-1">{order.shippingAddress.phone}</p>}
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment</p>
              </div>
              <p className="font-semibold text-foreground capitalize">
                {order.paymentMethod === "razorpay" ? "Online (Razorpay)" : order.paymentMethod}
              </p>
              <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold uppercase",
                order.paymentStatus === "paid"    ? "bg-green-100 text-green-700" :
                order.paymentStatus === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
              )}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
    {showCancelModal && (
      <CancelModal
        orderNumber={order.orderNumber}
        onClose={() => { setShowCancelModal(false); setCancelError(""); }}
        onConfirm={handleCancel}
        cancelling={cancelling}
        error={cancelError}
      />
    )}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OrdersContent() {
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [returns,     setReturns]     = useState<ReturnDoc[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<FilterTab>("All");
  const [returnModal, setReturnModal] = useState<Order | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/orders").then((r) => r.json()),
      fetch("/api/returns").then((r) => r.json()),
    ]).then(([ordersJson, returnsJson]) => {
      setOrders(ordersJson.data ?? []);
      setReturns(returnsJson.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const returnsByOrderId = Object.fromEntries(returns.map((r) => [r.orderId, r]));

  const filtered = tab === "All"
    ? orders
    : orders.filter((o) => TAB_TO_STATUSES[tab].includes(o.status));

  function handleReturnSuccess(returnDoc: ReturnDoc) {
    setReturns((p) => [...p, returnDoc]);
  }

  function handleOrderCancelled(orderId: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId
          ? {
              ...o,
              status: "cancelled",
              timeline: [
                ...o.timeline,
                { status: "cancelled", message: "Cancelled by user.", timestamp: new Date().toISOString() },
              ],
            }
          : o
      )
    );
  }

  return (
    <div className="container-padded pt-32 pb-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Account
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <Package className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">My Orders</h1>
            {!loading && <p className="text-xs text-muted-foreground">{orders.length} order{orders.length !== 1 ? "s" : ""} total</p>}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTER_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
                tab === t ? "bg-[#0f0f0f] text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}>
              {t}
              {t !== "All" && !loading && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({orders.filter((o) => TAB_TO_STATUSES[t].includes(o.status)).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-16 flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 mb-6">
              <ShoppingBag className="h-10 w-10 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {tab === "All" ? "No orders yet" : `No ${tab.toLowerCase()} orders`}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-8 leading-relaxed">
              {tab === "All"
                ? "Your order history will appear here. Start exploring our collection."
                : `You don't have any ${tab.toLowerCase()} orders right now.`}
            </p>
            <Link href="/shop"
              className="rounded-xl bg-[#0f0f0f] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((o) => (
              <OrderCard
                key={o._id}
                order={o}
                returnDoc={returnsByOrderId[o._id]}
                onReturnClick={setReturnModal}
                onCancelled={handleOrderCancelled}
              />
            ))}
          </div>
        )}

        {/* Tips */}
        {!loading && orders.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Need help with an order?</h3>
            <ul className="space-y-2">
              {[
                "Orders are processed within 1–2 business days.",
                "You'll receive an email when your order ships.",
                "Delivery typically takes 4–7 business days across India.",
                `Returns accepted within ${RETURN_WINDOW_DAYS} days of delivery — click "Return Order" on any delivered order.`,
                "WhatsApp us at +91 91355 64607 for any order issues.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#1a5c14] shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Return Modal */}
      {returnModal && (
        <ReturnModal
          order={returnModal}
          onClose={() => setReturnModal(null)}
          onSuccess={handleReturnSuccess}
        />
      )}
    </div>
  );
}
