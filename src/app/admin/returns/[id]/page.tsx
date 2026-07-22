"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReturnDoc {
  _id: string;
  returnNumber: string;
  orderNumber: string;
  orderId: string;
  status: string;
  reason: string;
  description?: string;
  images: string[];
  video?: string;
  createdAt: string;
  orderTotal: number;
  adminNote?: string;
  userId?: { _id: string; name: string; email: string; phone?: string };
  items: Array<{ _id: string; name: string; image: string; price: number; quantity: number }>;
  timeline: Array<{ status: string; message?: string; timestamp: string; performedBy: string }>;
  refund?: {
    amount?: number; status?: string; method?: string;
    gatewayRefundId?: string; initiatedAt?: string; completedAt?: string;
    failureReason?: string; notes?: string;
  };
}

const STATUS_BADGE: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-700", under_review: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700",
  refund_processing: "bg-purple-100 text-purple-700", refund_completed: "bg-emerald-100 text-emerald-700",
};
const STATUS_LABEL: Record<string, string> = {
  requested: "Requested", under_review: "Under Review", approved: "Approved",
  rejected: "Rejected", refund_processing: "Refund Processing", refund_completed: "Refund Completed",
};
const REASON_LABEL: Record<string, string> = {
  wrong_size: "Wrong Size", wrong_color: "Wrong Color", damaged_product: "Damaged Product",
  defective_product: "Defective Product", wrong_item: "Wrong Item Received",
  missing_items: "Missing Items", quality_issue: "Quality Issue",
  no_longer_needed: "No Longer Needed", other: "Other",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function AdminReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [returnDoc,  setReturn]    = useState<ReturnDoc | null>(null);
  const [loading,    setLoading]   = useState(true);
  const [acting,     setActing]    = useState(false);
  const [msg,        setMsg]       = useState("");

  // Form state for various actions
  const [rejectNote,    setRejectNote]    = useState("");
  const [approveNote,   setApproveNote]   = useState("");
  const [refundAmount,  setRefundAmount]  = useState("");
  const [refundNotes,   setRefundNotes]   = useState("");
  const [refundId,      setRefundId]      = useState("");
  const [failReason,    setFailReason]    = useState("");
  const [showReject,    setShowReject]    = useState(false);
  const [showRefund,    setShowRefund]    = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/admin/returns/${id}`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setReturn(j.data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setActing(true); setMsg("");
    const res  = await fetch(`/api/admin/returns/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action, ...extra }),
    });
    const json = await res.json();
    if (json.success) { setMsg(json.message ?? "Done."); load(); }
    else setMsg("Error: " + (json.error ?? "Unknown error"));
    setActing(false);
  }

  if (loading) return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />)}
    </div>
  );
  if (!returnDoc) return <div className="p-4 sm:p-6 lg:p-8 text-gray-500">Return not found.</div>;

  const r = returnDoc;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 shrink-0">
          <RotateCcw className="h-5 w-5 text-orange-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-black text-gray-900">{r.returnNumber}</h1>
          <p className="text-xs text-gray-500">Order {r.orderNumber} · {fmtDate(r.createdAt)}</p>
        </div>
        <span className={cn("shrink-0 rounded px-2.5 py-0.5 text-[11px] font-bold uppercase", STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-600")}>
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
      </div>

      {msg && (
        <div className={cn("rounded-xl px-4 py-3 text-sm font-semibold", msg.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200")}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — details */}
        <div className="lg:col-span-2 space-y-4">

          {/* Customer */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Customer</p>
            <p className="font-semibold text-gray-900">{r.userId?.name ?? "—"}</p>
            <p className="text-sm text-gray-500">{r.userId?.email ?? "—"}</p>
            {r.userId?.phone && <p className="text-sm text-gray-500">{r.userId.phone}</p>}
          </div>

          {/* Return info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Return Info</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400 text-xs">Reason</p><p className="font-semibold">{REASON_LABEL[r.reason] ?? r.reason}</p></div>
              <div><p className="text-gray-400 text-xs">Order Total</p><p className="font-semibold">₹{r.orderTotal.toLocaleString("en-IN")}</p></div>
            </div>
            {r.description && <div><p className="text-gray-400 text-xs">Description</p><p className="text-sm mt-1 leading-relaxed">{r.description}</p></div>}
            {r.adminNote && <div className="rounded-xl bg-amber-50 border border-amber-200 p-3"><p className="text-xs font-semibold text-amber-700">Admin Note: {r.adminNote}</p></div>}
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Items</p>
            <div className="space-y-3">
              {r.items.map((item) => (
                <div key={item._id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      : <div className="h-full w-full bg-gray-100" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity} · ₹{item.price.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          {r.images.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Customer Images</p>
              <div className="grid grid-cols-4 gap-2">
                {r.images.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Return image ${i + 1}`} className="aspect-square w-full rounded-xl object-cover hover:opacity-90 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Refund info */}
          {r.refund?.amount != null && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Refund</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-400 text-xs">Amount</p><p className="font-bold text-lg text-green-700">₹{r.refund.amount.toLocaleString("en-IN")}</p></div>
                <div><p className="text-gray-400 text-xs">Status</p><p className="font-semibold capitalize">{r.refund.status ?? "—"}</p></div>
                {r.refund.method && <div><p className="text-gray-400 text-xs">Method</p><p className="font-semibold capitalize">{r.refund.method}</p></div>}
                {r.refund.gatewayRefundId && <div className="col-span-2"><p className="text-gray-400 text-xs">Gateway Refund ID</p><p className="font-mono text-sm font-semibold">{r.refund.gatewayRefundId}</p></div>}
                {r.refund.failureReason && <div className="col-span-2 rounded-xl bg-red-50 border border-red-200 p-3"><p className="text-xs font-semibold text-red-700">{r.refund.failureReason}</p></div>}
              </div>
            </div>
          )}

          {/* Timeline */}
          {r.timeline.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Activity Timeline</p>
              <div className="space-y-0">
                {[...r.timeline].reverse().map((t, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", i === 0 ? "bg-[#1a5c14]" : "bg-gray-300")} />
                      {i < r.timeline.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-semibold text-gray-900 capitalize">{t.status.replace(/_/g, " ")}</p>
                      {t.message && <p className="text-xs text-gray-500 mt-0.5">{t.message}</p>}
                      <p className="text-[11px] text-gray-400 mt-1">{fmtDate(t.timestamp)} · {fmtTime(t.timestamp)} · by {t.performedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-6 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Actions</p>

            {/* REQUESTED / UNDER_REVIEW → Approve / Under Review / Reject */}
            {(r.status === "requested" || r.status === "under_review") && (
              <>
                {r.status === "requested" && (
                  <button onClick={() => act("under_review")} disabled={acting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50">
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Mark Under Review
                  </button>
                )}
                <button onClick={() => act("approve", { adminNote: approveNote })} disabled={acting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50">
                  {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve Return
                </button>
                <input value={approveNote} onChange={(e) => setApproveNote(e.target.value)}
                  placeholder="Optional note for customer…"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:border-green-400 focus:outline-none" />

                {!showReject ? (
                  <button onClick={() => setShowReject(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors">
                    <X className="h-4 w-4" /> Reject Return
                  </button>
                ) : (
                  <div className="space-y-2">
                    <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Rejection reason (required)…" rows={3}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:border-red-400 focus:outline-none resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => { if (!rejectNote.trim()) return; act("reject", { adminNote: rejectNote }); setShowReject(false); }}
                        disabled={acting || !rejectNote.trim()}
                        className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                        Confirm Reject
                      </button>
                      <button onClick={() => setShowReject(false)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* APPROVED → Process Refund */}
            {r.status === "approved" && (
              <>
                {!showRefund ? (
                  <button onClick={() => { setShowRefund(true); setRefundAmount(String(r.orderTotal)); }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a5c14] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15490f] transition-colors">
                    Process Refund
                  </button>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-600">Refund Amount (₹)</label>
                    <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#1a5c14] focus:outline-none" />
                    <textarea value={refundNotes} onChange={(e) => setRefundNotes(e.target.value)}
                      placeholder="Notes (optional)…" rows={2}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs resize-none focus:outline-none" />
                    <div className="flex gap-2">
                      <button
                        onClick={() => act("process_refund", { refundAmount: parseFloat(refundAmount), refundNotes })}
                        disabled={acting || !refundAmount}
                        className="flex-1 rounded-xl bg-[#1a5c14] px-3 py-2 text-xs font-semibold text-white hover:bg-[#15490f] disabled:opacity-50 transition-colors">
                        {acting ? "Processing…" : "Confirm Refund"}
                      </button>
                      <button onClick={() => setShowRefund(false)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* REFUND_PROCESSING → Mark Complete / Mark Failed */}
            {r.status === "refund_processing" && (
              <>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">Refund ID / Transaction Ref</label>
                  <input value={refundId} onChange={(e) => setRefundId(e.target.value)}
                    placeholder="e.g. rfnd_xxxxx or UTR number"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:border-[#1a5c14] focus:outline-none" />
                </div>
                <button onClick={() => act("complete_refund", { adminNote: refundId || undefined })} disabled={acting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50">
                  {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Mark Refund Complete
                </button>
                <div className="space-y-2">
                  <input value={failReason} onChange={(e) => setFailReason(e.target.value)}
                    placeholder="Failure reason (if failed)…"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:border-red-400 focus:outline-none" />
                  <button onClick={() => act("fail_refund", { failureReason: failReason })} disabled={acting || !failReason.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50">
                    <X className="h-4 w-4" /> Mark Refund Failed
                  </button>
                </div>
              </>
            )}

            {/* Terminal states */}
            {(r.status === "rejected" || r.status === "refund_completed") && (
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-center text-xs text-gray-400 font-medium">
                {r.status === "refund_completed" ? "✅ Return & Refund Completed" : "❌ Return Rejected — No further actions"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
