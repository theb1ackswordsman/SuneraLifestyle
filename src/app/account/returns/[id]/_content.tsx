"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Check, X, AlertCircle } from "lucide-react";
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
  createdAt: string;
  orderTotal: number;
  adminNote?: string;
  items: Array<{ _id: string; name: string; image: string; price: number; quantity: number }>;
  timeline: Array<{ status: string; message?: string; timestamp: string; performedBy: string }>;
  refund?: {
    amount?: number;
    status?: string;
    method?: string;
    gatewayRefundId?: string;
    initiatedAt?: string;
    completedAt?: string;
    failureReason?: string;
  };
}

const STATUS_STEPS = [
  { key: "requested",         label: "Requested" },
  { key: "under_review",      label: "Under Review" },
  { key: "approved",          label: "Approved" },
  { key: "refund_processing", label: "Refund Processing" },
  { key: "refund_completed",  label: "Completed" },
];
const STEP_INDEX: Record<string, number> = {
  requested: 0, under_review: 1, approved: 2, refund_processing: 3, refund_completed: 4,
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

function ReturnStepper({ status }: { status: string }) {
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        <X className="h-4 w-4 shrink-0" />
        <span className="font-semibold">Return Rejected</span>
      </div>
    );
  }
  const currentIdx = STEP_INDEX[status] ?? 0;
  return (
    <div className="relative">
      <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100 z-0" />
      <div
        className="absolute top-5 left-5 h-0.5 bg-[#1a5c14] z-0 transition-all duration-500"
        style={{ width: currentIdx === 0 ? "0%" : `${(currentIdx / (STATUS_STEPS.length - 1)) * (100 - 100 / STATUS_STEPS.length)}%` }}
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
              <span className={cn("text-[10px] font-semibold text-center leading-tight", done ? "text-[#1a5c14]" : "text-gray-400")}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ReturnDetailContent() {
  const { id } = useParams<{ id: string }>();
  const [returnDoc, setReturn] = useState<ReturnDoc | null>(null);
  const [loading,   setLoading] = useState(true);
  const [error,     setError]   = useState("");

  useEffect(() => {
    fetch(`/api/returns/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setReturn(j.data);
        else setError(j.error ?? "Return not found.");
      })
      .catch(() => setError("Failed to load return details."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="container-padded pt-32 pb-16 max-w-3xl mx-auto space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
    </div>
  );

  if (error || !returnDoc) return (
    <div className="container-padded pt-32 pb-16 max-w-3xl mx-auto text-center">
      <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
      <p className="text-foreground font-semibold">{error || "Return not found."}</p>
      <Link href="/account/returns" className="mt-4 inline-block text-sm text-[#1a5c14] hover:underline">← Back to Returns</Link>
    </div>
  );

  const r = returnDoc;

  return (
    <div className="container-padded pt-32 pb-16">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/account/returns"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Returns
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
            <RotateCcw className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-black">{r.returnNumber}</h1>
            <p className="text-xs text-muted-foreground">Order {r.orderNumber} · Submitted {fmtDate(r.createdAt)}</p>
          </div>
        </div>

        {/* Status stepper */}
        <div className="rounded-2xl border border-border bg-background p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Return Status</p>
          <ReturnStepper status={r.status} />
        </div>

        {/* Admin note if rejected */}
        {r.status === "rejected" && r.adminNote && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-bold text-red-700 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-600 leading-relaxed">{r.adminNote}</p>
          </div>
        )}

        {/* Approved note */}
        {r.status === "approved" && r.adminNote && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm font-bold text-green-700 mb-1">Admin Note</p>
            <p className="text-sm text-green-600 leading-relaxed">{r.adminNote}</p>
          </div>
        )}

        {/* Refund info */}
        {r.refund?.amount != null && (
          <div className="rounded-2xl border border-border bg-background p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Refund Details</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Amount</p>
                <p className="font-bold text-lg text-[#1a5c14]">₹{r.refund.amount.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <p className="font-semibold capitalize">{r.refund.status ?? "—"}</p>
              </div>
              {r.refund.gatewayRefundId && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Refund ID</p>
                  <p className="font-mono text-sm font-semibold">{r.refund.gatewayRefundId}</p>
                </div>
              )}
              {r.refund.completedAt && (
                <div>
                  <p className="text-muted-foreground text-xs">Completed On</p>
                  <p className="font-semibold">{fmtDate(r.refund.completedAt)}</p>
                </div>
              )}
              {r.refund.failureReason && (
                <div className="col-span-2 rounded-xl bg-red-50 border border-red-200 p-3">
                  <p className="text-xs font-semibold text-red-700">Failure Reason: {r.refund.failureReason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Return info */}
        <div className="rounded-2xl border border-border bg-background p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Return Details</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Reason</p>
              <p className="font-semibold">{REASON_LABEL[r.reason] ?? r.reason}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Order Total</p>
              <p className="font-semibold">₹{r.orderTotal.toLocaleString("en-IN")}</p>
            </div>
          </div>
          {r.description && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Description</p>
              <p className="text-sm leading-relaxed">{r.description}</p>
            </div>
          )}
        </div>

        {/* Images */}
        {r.images.length > 0 && (
          <div className="rounded-2xl border border-border bg-background p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Uploaded Images</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {r.images.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Return image ${i + 1}`} className="aspect-square w-full rounded-xl object-cover hover:opacity-90 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Items in Return</p>
          <div className="space-y-3">
            {r.items.map((item) => (
              <div key={item._id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    : <div className="h-full w-full bg-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity} · ₹{item.price.toLocaleString("en-IN")} each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        {r.timeline.length > 0 && (
          <div className="rounded-2xl border border-border bg-background p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Activity Timeline</p>
            <div className="space-y-0">
              {[...r.timeline].reverse().map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", i === 0 ? "bg-[#1a5c14]" : "bg-gray-300")} />
                    {i < r.timeline.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                  </div>
                  <div className="pb-4 min-w-0">
                    <p className="text-sm font-semibold capitalize">{t.status.replace(/_/g, " ")}</p>
                    {t.message && <p className="text-xs text-muted-foreground mt-0.5">{t.message}</p>}
                    <p className="text-[11px] text-muted-foreground/60 mt-1">{fmtDate(t.timestamp)} · {fmtTime(t.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Need help */}
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground leading-relaxed">
          Need help with your return? WhatsApp us at{" "}
          <a href="https://wa.me/919135564607" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#25D366] hover:underline">
            +91 91355 64607
          </a>
        </div>
      </div>
    </div>
  );
}
