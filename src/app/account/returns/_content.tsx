"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, ChevronRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReturnDoc {
  _id: string;
  returnNumber: string;
  orderNumber: string;
  status: string;
  reason: string;
  createdAt: string;
  orderTotal: number;
  refund?: { amount?: number; status?: string };
}

const STATUS_BADGE: Record<string, string> = {
  requested:         "bg-yellow-100 text-yellow-700 border-yellow-200",
  under_review:      "bg-blue-100 text-blue-700 border-blue-200",
  approved:          "bg-green-100 text-green-700 border-green-200",
  rejected:          "bg-red-100 text-red-700 border-red-200",
  cancelled:         "bg-gray-100 text-gray-700 border-gray-200",
  refund_processing: "bg-purple-100 text-purple-700 border-purple-200",
  refund_completed:  "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STATUS_LABEL: Record<string, string> = {
  requested:         "Requested",
  under_review:      "Under Review",
  approved:          "Approved",
  rejected:          "Rejected",
  cancelled:         "Cancelled",
  refund_processing: "Refund Processing",
  refund_completed:  "Refund Completed",
};

const REASON_LABEL: Record<string, string> = {
  wrong_size:        "Wrong Size",
  wrong_color:       "Wrong Color",
  damaged_product:   "Damaged Product",
  defective_product: "Defective Product",
  wrong_item:        "Wrong Item Received",
  missing_items:     "Missing Items",
  quality_issue:     "Quality Issue",
  no_longer_needed:  "No Longer Needed",
  other:             "Other",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReturnsContent() {
  const [returns, setReturns] = useState<ReturnDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/returns")
      .then((r) => r.json())
      .then((j) => setReturns(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-padded pt-28 sm:pt-32 pb-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Account
        </Link>

        <div className="flex items-center gap-3 mb-8">

          <div>
            <h1 className="text-2xl font-black text-foreground">My Returns</h1>
            {!loading && <p className="text-xs text-muted-foreground">{returns.length} return request{returns.length !== 1 ? "s" : ""}</p>}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : returns.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-16 flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 mb-6">
              <Package className="h-10 w-10 text-orange-300" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No return requests</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
              You haven&apos;t submitted any return requests yet. Returns can be requested within 7 days of delivery.
            </p>
            <Link href="/account/orders"
              className="rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90 transition-opacity">
              View Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {returns.map((r) => (
              <Link
                key={r._id}
                href={`/account/returns/${r._id}`}
                className="block rounded-2xl border border-border bg-background p-4 sm:p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-sm font-bold text-foreground block truncate">{r.returnNumber}</span>
                    <span className="text-xs text-muted-foreground block mt-0.5 truncate">Order {r.orderNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-tight whitespace-nowrap", STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </div>
                <div className="border-t border-border/60 pt-2.5 mt-2.5 flex items-center justify-between gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="truncate">{REASON_LABEL[r.reason] ?? r.reason}</span>
                  <span className="shrink-0">{fmtDate(r.createdAt)}</span>
                </div>
                {r.refund?.amount && (
                  <p className="text-xs text-[#1a5c14] font-semibold mt-1.5">
                    Refund: ₹{r.refund.amount.toLocaleString("en-IN")}
                    {r.refund.status ? ` · ${r.refund.status}` : ""}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
