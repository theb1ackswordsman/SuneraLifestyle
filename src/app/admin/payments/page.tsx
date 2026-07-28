"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard, Search, RefreshCw, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Eye, X, AlertTriangle, Clock,
  ShieldCheck, FileText, Loader2, Lock, Check, Plus, Trash2, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────

interface PaymentLog {
  action: string;
  performedBy: string;
  note?: string;
  at: string;
}

interface PaymentAttempt {
  attemptedAt: string;
  source: string;
  gatewayPaymentId?: string;
  status: string;
  note?: string;
}

interface AdminNoteItem {
  _id?: string;
  note: string;
  createdAt: string;
  createdBy?: string;
}

interface Payment {
  _id: string;
  paymentRef: string;
  orderNumber: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  gatewayName: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  transactionRef?: string;
  status: string;
  webhookReceived: boolean;
  adminNote?: string;
  adminNotes?: AdminNoteItem[];
  adminVerifiedAt?: string;
  attempts?: PaymentAttempt[];
  logs?: PaymentLog[];
  userId?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface OrderDetail {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:              { label: "Pending",              className: "bg-yellow-100 text-yellow-800" },
  success:              { label: "Success",              className: "bg-green-100 text-green-800" },
  failed:               { label: "Failed",               className: "bg-red-100 text-red-800" },
  pending_verification: { label: "Under Verification",   className: "bg-orange-100 text-orange-800" },
  refunded:             { label: "Refunded",             className: "bg-purple-100 text-purple-800" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-gray-100 text-gray-700" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", cfg.className)}>
      {cfg.label}
    </span>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
  const [payments, setPayments]   = useState<Payment[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [loading, setLoading]     = useState(false);
  const [statusFilter, setStatus] = useState("");
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [detail, setDetail]        = useState<{ payment: Payment; order: OrderDetail | null } | null>(null);
  const [detailLoading, setDL]     = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const [verifyModal, setVerifyModal] = useState<{ payment: Payment; action: "mark_success" | "mark_failed" } | null>(null);
  const [verifyNote, setVerifyNote] = useState("");
  const [verifyLoading, setVL]    = useState(false);
  const [verifyErr, setVerifyErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("q", search);
      const res = await fetch(`/api/admin/payments?${params}`);
      const json = await res.json();
      if (json.success) {
        setPayments(json.data.payments ?? []);
        setTotal(json.data.total ?? 0);
        setPages(json.data.pages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(p: Payment) {
    setDL(true);
    setDetail(null);
    setAdminNoteInput("");
    try {
      const res = await fetch(`/api/admin/payments/${p._id}`);
      const json = await res.json();
      if (json.success) {
        setDetail(json.data);
      }
    } finally {
      setDL(false);
      if (!detail) setDetail({ payment: p, order: null });
    }
  }

  async function addAdminNote() {
    if (!detail || !adminNoteInput.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/payments/${detail.payment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: adminNoteInput.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setDetail((prev) => prev ? {
          ...prev,
          payment: {
            ...prev.payment,
            adminNote: json.data.adminNote,
            adminNotes: json.data.adminNotes,
          }
        } : null);
        setAdminNoteInput("");
        await load();
      }
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteAdminNote(noteId: string) {
    if (!detail) return;
    setDeletingNoteId(noteId);
    try {
      const res = await fetch(`/api/admin/payments/${detail.payment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteNoteId: noteId }),
      });
      const json = await res.json();
      if (json.success) {
        setDetail((prev) => prev ? {
          ...prev,
          payment: {
            ...prev.payment,
            adminNote: json.data.adminNote,
            adminNotes: json.data.adminNotes,
          }
        } : null);
        await load();
      }
    } finally {
      setDeletingNoteId(null);
    }
  }

  async function submitVerify() {
    if (!verifyModal) return;
    setVL(true);
    setVerifyErr("");
    try {
      const res = await fetch(`/api/admin/payments/${verifyModal.payment._id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: verifyModal.action, note: verifyNote }),
      });
      const json = await res.json();
      if (!res.ok) { setVerifyErr(json.error ?? "Failed"); return; }
      setVerifyModal(null);
      setVerifyNote("");
      setDetail(null);
      await load();
    } catch {
      setVerifyErr("Network error. Please try again.");
    } finally {
      setVL(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} payment records</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
            placeholder="Search ref, order, gateway ID..."
            className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c14]/30"
          />
        </div>
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c14]/30"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="pending_verification">Under Verification</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Alert for pending verification */}
      {payments.some((p) => p.status === "pending_verification") && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-orange-800">Payments require manual verification</p>
            <p className="text-xs text-orange-700 mt-0.5">
              Some payments are under verification. Check the payment gateway dashboard and use the verify action to confirm or reject them.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              {["Payment Ref", "Order", "Customer", "Amount", "Method", "Gateway ID", "Status", "Webhook", "Date", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={10} className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-400">No payments found</td></tr>
            ) : payments.map((p) => (
              <tr key={p._id} className={cn("hover:bg-gray-50/50 transition-colors", p.status === "pending_verification" && "bg-orange-50/30")}>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{p.paymentRef}</td>
                <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900">{p.orderNumber}</td>
                <td className="px-4 py-3">
                  <div className="text-xs font-medium text-gray-900">{p.userId?.name ?? "—"}</div>
                  <div className="text-xs text-gray-400">{p.userId?.email ?? ""}</div>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">{formatPrice(p.amount)}</td>
                <td className="px-4 py-3 capitalize text-gray-700">{p.gatewayName}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.gatewayPaymentId ?? p.gatewayOrderId ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3">
                  {p.webhookReceived
                    ? <span className="text-green-600 text-xs font-semibold flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Yes</span>
                    : <span className="text-gray-400 text-xs flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> No</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openDetail(p)}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                      title="View Details & Notes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {p.status === "pending_verification" && (
                      <>
                        <button
                          onClick={() => { setVerifyModal({ payment: p, action: "mark_success" }); setVerifyNote(""); setVerifyErr(""); }}
                          className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 transition-colors"
                          title="Mark as Successful"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setVerifyModal({ payment: p, action: "mark_failed" }); setVerifyNote(""); setVerifyErr(""); }}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                          title="Mark as Failed"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────────────────────────────── */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4">
          <div className="relative my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <button
              onClick={() => setDetail(null)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>

            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : detail && (
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a5c14]/10">
                    <CreditCard className="h-5 w-5 text-[#1a5c14]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">{detail.payment.paymentRef}</h2>
                    <p className="text-sm text-gray-500">Order {detail.payment.orderNumber}</p>
                  </div>
                  <div className="ml-auto"><StatusBadge status={detail.payment.status} /></div>
                </div>

                {/* Key Info Grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {[
                    { label: "Amount", value: formatPrice(detail.payment.amount) },
                    { label: "Method", value: detail.payment.gatewayName },
                    { label: "Webhook", value: detail.payment.webhookReceived ? "Received ✓" : "Not received" },
                    { label: "Gateway Order ID", value: detail.payment.gatewayOrderId ?? "—" },
                    { label: "Gateway Payment ID", value: detail.payment.gatewayPaymentId ?? "—" },
                    { label: "Bank Ref (RRN)", value: detail.payment.transactionRef ?? "—" },
                    { label: "Customer", value: detail.payment.userId?.name ?? "—" },
                    { label: "Email", value: detail.payment.userId?.email ?? "—" },
                    { label: "Verified At", value: detail.payment.adminVerifiedAt ? new Date(detail.payment.adminVerifiedAt).toLocaleDateString("en-IN") : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-gray-900 break-all">{value}</p>
                    </div>
                  ))}
                </div>

                {/* ── Multiple Private Admin Notes Section ──────────────────── */}
                <div className="rounded-2xl border border-[#1a5c14]/20 bg-[#1a5c14]/5 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#1a5c14]" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                        Private Admin Notes
                      </h3>
                      <span className="rounded-full bg-[#1a5c14]/10 px-2 py-0.5 text-[10px] font-bold text-[#1a5c14]">
                        Private to Admin
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                      {detail.payment.adminNotes?.length ?? 0} note{(detail.payment.adminNotes?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Add New Note Input */}
                  <div className="space-y-2">
                    <textarea
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      placeholder="Add a new private admin note (e.g. Bank reference verified, Cash collected, customer call note)..."
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-900 focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={addAdminNote}
                        disabled={savingNote || !adminNoteInput.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a5c14] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#103a0c] transition-all disabled:opacity-50"
                      >
                        {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Add Note</>}
                      </button>
                    </div>
                  </div>

                  {/* Existing Notes List */}
                  {((detail.payment.adminNotes && detail.payment.adminNotes.length > 0) || detail.payment.adminNote) ? (
                    <div className="space-y-2 pt-2 border-t border-[#1a5c14]/10">
                      {/* Render adminNotes array */}
                      {detail.payment.adminNotes && detail.payment.adminNotes.length > 0 ? (
                        [...detail.payment.adminNotes].reverse().map((n, idx) => (
                          <div key={n._id ?? idx} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                <MessageSquare className="h-3 w-3 text-[#1a5c14]" />
                                <span className="font-semibold text-gray-700">{n.createdBy ?? "Admin"}</span>
                                <span>&middot;</span>
                                <span>{new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                              <p className="text-xs text-gray-800 font-medium whitespace-pre-wrap leading-relaxed">
                                {n.note}
                              </p>
                            </div>
                            {n._id && (
                              <button
                                onClick={() => deleteAdminNote(n._id!)}
                                disabled={deletingNoteId === n._id}
                                className="text-gray-400 hover:text-red-600 p-1 transition-colors shrink-0"
                                title="Delete Note"
                              >
                                {deletingNoteId === n._id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        ))
                      ) : detail.payment.adminNote ? (
                        /* Fallback for legacy single adminNote */
                        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
                          <p className="text-xs text-gray-800 font-medium whitespace-pre-wrap">
                            {detail.payment.adminNote}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-2 italic">
                      No private admin notes added yet.
                    </p>
                  )}
                </div>

                {/* Attempt Log */}
                {detail.payment.attempts && detail.payment.attempts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Payment Attempts
                    </h3>
                    <div className="space-y-2">
                      {detail.payment.attempts.map((a, i) => (
                        <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-700 capitalize">{a.source} — {a.status}</span>
                            <span className="text-gray-400">{new Date(a.attemptedAt).toLocaleString("en-IN")}</span>
                          </div>
                          {a.gatewayPaymentId && <p className="text-gray-500 font-mono">Payment ID: {a.gatewayPaymentId}</p>}
                          {a.note && <p className="text-gray-500 mt-0.5">{a.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit Log */}
                {detail.payment.logs && detail.payment.logs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Audit Trail
                    </h3>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {detail.payment.logs.map((log, i) => (
                        <div key={i} className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 px-3 py-2 text-xs">
                          <div>
                            <span className="font-semibold text-gray-800 capitalize">[{log.performedBy}]</span>{" "}
                            <span className="text-gray-600">{log.action}</span>
                            {log.note && <p className="text-gray-400 mt-0.5 italic">{log.note}</p>}
                          </div>
                          <span className="text-gray-400 shrink-0">{new Date(log.at).toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verify actions inside detail */}
                {detail.payment.status === "pending_verification" && (
                  <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => { setVerifyModal({ payment: detail.payment, action: "mark_success" }); setVerifyNote(""); setVerifyErr(""); setDetail(null); }}
                      className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" /> Mark Successful
                    </button>
                    <button
                      onClick={() => { setVerifyModal({ payment: detail.payment, action: "mark_failed" }); setVerifyNote(""); setVerifyErr(""); setDetail(null); }}
                      className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="h-4 w-4" /> Mark Failed
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Verify Confirmation Modal ─────────────────────────────────────── */}
      {verifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className={cn(
              "mb-4 flex h-12 w-12 items-center justify-center rounded-full",
              verifyModal.action === "mark_success" ? "bg-green-100" : "bg-red-100"
            )}>
              {verifyModal.action === "mark_success"
                ? <CheckCircle className="h-6 w-6 text-green-600" />
                : <XCircle className="h-6 w-6 text-red-600" />
              }
            </div>
            <h3 className="text-base font-black text-gray-900">
              {verifyModal.action === "mark_success" ? "Confirm Payment Successful" : "Mark Payment as Failed"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {verifyModal.action === "mark_success"
                ? "This will confirm the order, notify the customer, and reduce inventory."
                : "This will mark the order as unpaid and notify the customer."}
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Admin Note <span className="text-gray-400">(required)</span>
              </label>
              <textarea
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                placeholder="e.g. Verified via Razorpay dashboard — payment ID pay_XXXX confirmed"
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c14]/30"
              />
            </div>

            {verifyErr && (
              <p className="mt-2 text-xs text-red-600">{verifyErr}</p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setVerifyModal(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitVerify}
                disabled={verifyLoading || !verifyNote.trim()}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50",
                  verifyModal.action === "mark_success" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                )}
              >
                {verifyLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
