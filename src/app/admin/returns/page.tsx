"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RotateCcw, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReturnRow {
  _id: string;
  returnNumber: string;
  orderNumber: string;
  reason: string;
  status: string;
  createdAt: string;
  orderTotal: number;
  userId?: { name: string; email: string };
}

const STATUS_BADGE: Record<string, string> = {
  requested:         "bg-yellow-100 text-yellow-700",
  under_review:      "bg-blue-100 text-blue-700",
  approved:          "bg-green-100 text-green-700",
  rejected:          "bg-red-100 text-red-700",
  refund_processing: "bg-purple-100 text-purple-700",
  refund_completed:  "bg-emerald-100 text-emerald-700",
};

const STATUS_LABEL: Record<string, string> = {
  requested: "Requested", under_review: "Under Review", approved: "Approved",
  rejected: "Rejected", refund_processing: "Refund Processing", refund_completed: "Refund Completed",
};

const REASON_LABEL: Record<string, string> = {
  wrong_size: "Wrong Size", wrong_color: "Wrong Color", damaged_product: "Damaged",
  defective_product: "Defective", wrong_item: "Wrong Item", missing_items: "Missing Items",
  quality_issue: "Quality Issue", no_longer_needed: "No Longer Needed", other: "Other",
};

const ALL_STATUSES = ["", "requested", "under_review", "approved", "rejected", "refund_processing", "refund_completed"];

export default function AdminReturnsPage() {
  const [returns,    setReturns]    = useState<ReturnRow[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status,     setStatus]     = useState("");
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), ...(status && { status }) });
    fetch(`/api/admin/returns?${q}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) { setReturns(j.data.returns); setTotal(j.data.total); setTotalPages(j.data.totalPages); }
      })
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 shrink-0">
          <RotateCcw className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Returns</h1>
          <p className="text-xs text-gray-500">{total} total return request{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Status filter — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {ALL_STATUSES.map((s) => (
          <button key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition-colors whitespace-nowrap shrink-0",
              status === s ? "bg-[#1a5c14] border-[#1a5c14] text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            )}>
            {s === "" ? "All" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))
        ) : returns.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-400 text-sm">
            No return requests found.
          </div>
        ) : (
          returns.map((r) => (
            <div key={r._id} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-gray-900">{r.returnNumber}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Order: {r.orderNumber}</p>
                </div>
                <span className={cn("shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase", STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-600")}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{r.userId?.name ?? "—"}</p>
                  <p className="text-xs text-gray-400">{r.userId?.email ?? ""}</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">₹{r.orderTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500">{REASON_LABEL[r.reason] ?? r.reason}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <Link href={`/admin/returns/${r._id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  <Eye className="h-3.5 w-3.5" /> View
                </Link>
              </div>
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
                {["Return #", "Order", "Customer", "Reason", "Total", "Status", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3.5 font-semibold text-gray-500 uppercase text-xs tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-4"><div className="h-4 w-full animate-pulse rounded bg-gray-100" /></td>
                  ))}</tr>
                ))
              ) : returns.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No return requests found.</td></tr>
              ) : (
                returns.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 font-mono text-sm font-bold text-gray-900">{r.returnNumber}</td>
                    <td className="px-4 py-4 text-xs font-semibold text-gray-700">{r.orderNumber}</td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900 text-sm">{r.userId?.name ?? "—"}</p>
                      <p className="text-xs text-gray-400">{r.userId?.email ?? ""}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-600">{REASON_LABEL[r.reason] ?? r.reason}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">₹{r.orderTotal.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-4">
                      <span className={cn("rounded px-2 py-0.5 text-[11px] font-bold uppercase", STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-600")}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/returns/${r._id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
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
