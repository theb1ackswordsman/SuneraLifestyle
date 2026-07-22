"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Loader2, X, Check, AlertCircle,
  Ticket, ToggleLeft, ToggleRight, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Coupon {
  _id: string; code: string; description: string;
  type: "percentage" | "flat" | "free_shipping" | "bogo";
  value: number; minOrderAmount: number; maxDiscountAmount?: number;
  usageLimit?: number; usageCount: number;
  isActive: boolean; startDate: string | null; endDate: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  percentage: "% Off", flat: "₹ Flat", free_shipping: "Free Ship", bogo: "BOGO",
};
const TYPE_COLORS: Record<string, string> = {
  percentage: "bg-blue-50 text-blue-700 border-blue-200",
  flat: "bg-amber-50 text-amber-700 border-amber-200",
  free_shipping: "bg-emerald-50 text-emerald-700 border-emerald-200",
  bogo: "bg-purple-50 text-purple-700 border-purple-200",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function isExpired(endDate: string | null) {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  code: "", description: "", type: "percentage" as Coupon["type"],
  value: "", minOrderAmount: "0", maxDiscountAmount: "",
  usageLimit: "", startDate: "", endDate: "", isActive: true,
};

function CouponModal({ coupon, onClose, onSave }: {
  coupon: Partial<Coupon> | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const editing = !!coupon?._id;
  const [form,    setForm]    = useState({ ...EMPTY_FORM, ...coupon
    ? {
        code: coupon.code ?? "",
        description: coupon.description ?? "",
        type: coupon.type ?? "percentage",
        value: String(coupon.value ?? ""),
        minOrderAmount: String(coupon.minOrderAmount ?? 0),
        maxDiscountAmount: coupon.maxDiscountAmount != null ? String(coupon.maxDiscountAmount) : "",
        usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
        startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : "",
        endDate:   coupon.endDate   ? coupon.endDate.slice(0, 10)   : "",
        isActive: coupon.isActive ?? true,
      }
    : {} });
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState("");

  function set(k: keyof typeof form, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim())       { setError("Code is required."); return; }
    if (!form.value)             { setError("Discount value is required."); return; }
    if (!form.startDate)         { setError("Start date is required."); return; }
    if (!form.endDate)           { setError("End date is required."); return; }
    if (new Date(form.endDate) <= new Date(form.startDate))
      { setError("End date must be after start date."); return; }

    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        description: form.description,
        type: form.type,
        value: Number(form.value),
        minOrderAmount: Number(form.minOrderAmount || 0),
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        startDate: new Date(form.startDate).toISOString(),
        endDate:   new Date(form.endDate).toISOString(),
        isActive: form.isActive,
      };
      const url    = editing ? `/api/admin/coupons/${coupon!._id}` : "/api/admin/coupons";
      const method = editing ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json   = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to save."); return; }
      onSave();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <h2 className="text-base font-bold text-gray-900">{editing ? "Edit Coupon" : "Create Coupon"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Coupon Code *</Label>
              <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20" className={inp} required />
              <p className="mt-1 text-[11px] text-gray-400">3–20 characters, letters and numbers only</p>
            </div>

            <div className="col-span-2">
              <Label>Description *</Label>
              <input value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="Get 20% off on all orders" className={inp} required />
            </div>

            <div>
              <Label>Discount Type *</Label>
              <select value={form.type} onChange={(e) => set("type", e.target.value as Coupon["type"])} className={inp}>
                <option value="percentage">Percentage (% off)</option>
                <option value="flat">Flat amount (₹ off)</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>

            <div>
              <Label>{form.type === "percentage" ? "Percentage %" : form.type === "flat" ? "Amount ₹" : "Value"} *</Label>
              <input type="number" value={form.value} onChange={(e) => set("value", e.target.value)}
                min={0} max={form.type === "percentage" ? 100 : undefined}
                placeholder={form.type === "percentage" ? "e.g. 20" : "e.g. 150"} className={inp} />
            </div>

            <div>
              <Label>Min. Order Amount (₹)</Label>
              <input type="number" value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)}
                min={0} placeholder="0" className={inp} />
            </div>

            {form.type === "percentage" && (
              <div>
                <Label>Max Discount Cap (₹)</Label>
                <input type="number" value={form.maxDiscountAmount} onChange={(e) => set("maxDiscountAmount", e.target.value)}
                  min={0} placeholder="Optional" className={inp} />
              </div>
            )}

            <div>
              <Label>Usage Limit (total)</Label>
              <input type="number" value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)}
                min={1} placeholder="Unlimited" className={inp} />
            </div>

            <div>
              <Label>Start Date *</Label>
              <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={inp} required />
            </div>

            <div>
              <Label>End Date *</Label>
              <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={inp} required />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 accent-[#1a5c14] rounded" />
            <span className="text-sm font-medium text-gray-700">Active (visible to customers)</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1a5c14] py-2.5 text-sm font-semibold text-white hover:bg-[#154a10] transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inp = "flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c14]/30 focus:border-[#1a5c14]";
function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-xs font-semibold text-gray-600">{children}</p>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCouponsPage() {
  const [coupons,  setCoupons]  = useState<Coupon[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [modal,    setModal]    = useState<Partial<Coupon> | null | false>(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast,    setToast]    = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/coupons");
      const json = await res.json();
      setCoupons(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleToggle(c: Coupon) {
    await fetch(`/api/admin/coupons/${c._id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    setCoupons((prev) => prev.map((x) => x._id === c._id ? { ...x, isActive: !x.isActive } : x));
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this coupon? This cannot be undone.")) return;
    setDeleting(id);
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    setCoupons((prev) => prev.filter((c) => c._id !== id));
    setDeleting(null);
    showToast("Coupon deleted.");
  }

  const filtered = coupons.filter((c) =>
    c.code.includes(search.toUpperCase()) || c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-[#1a5c14] px-4 py-3 text-sm font-semibold text-white shadow-lg">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      {/* Modal */}
      {modal !== false && (
        <CouponModal
          coupon={modal}
          onClose={() => setModal(false)}
          onSave={() => { setModal(false); load(); showToast(modal?._id ? "Coupon updated!" : "Coupon created!"); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a5c14]/10">
            <Ticket className="h-5 w-5 text-[#1a5c14]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Coupons</h1>
            <p className="text-xs text-gray-500">{coupons.length} coupon{coupons.length !== 1 ? "s" : ""} total</p>
          </div>
        </div>
        <button
          onClick={() => setModal(null)}
          className="flex items-center gap-2 rounded-xl bg-[#1a5c14] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#154a10] transition-colors"
        >
          <Plus className="h-4 w-4" /> Create Coupon
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search coupons…"
          className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c14]/30"
        />
      </div>

      {/* Empty / loading states shared */}
      {loading ? (
        <>
          <div className="sm:hidden space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
          <div className="hidden sm:flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
          </div>
        </>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-20 text-center">
          <Ticket className="h-10 w-10 text-gray-300 mb-3" />
          <p className="font-semibold text-gray-600">{search ? "No coupons match your search" : "No coupons yet"}</p>
          {!search && <p className="text-sm text-gray-400 mt-1">Click &quot;Create Coupon&quot; to add your first one.</p>}
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="sm:hidden space-y-3">
            {filtered.map((c) => {
              const expired = isExpired(c.endDate);
              return (
                <div key={c._id} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {c.code}
                      </span>
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">{c.description || "—"}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setModal(c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c._id)} disabled={deleting === c._id} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50">
                        {deleting === c._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-bold", TYPE_COLORS[c.type])}>
                      {TYPE_LABELS[c.type]}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {c.type === "percentage" ? `${c.value}%` : c.type === "flat" ? `₹${c.value}` : "—"}
                    </span>
                    {c.minOrderAmount > 0 && (
                      <span className="text-xs text-gray-500">Min ₹{c.minOrderAmount}</span>
                    )}
                    <span className={cn("text-xs", expired ? "text-red-500 font-semibold" : "text-gray-500")}>
                      Until {fmtDate(c.endDate)}{expired ? " (Expired)" : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs", c.usageLimit && c.usageCount >= c.usageLimit ? "text-red-500 font-semibold" : "text-gray-500")}>
                      {c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""} uses
                    </span>
                    <button onClick={() => handleToggle(c)} className="flex items-center gap-1.5">
                      {c.isActive
                        ? <ToggleRight className="h-6 w-6 text-[#1a5c14]" />
                        : <ToggleLeft className="h-6 w-6 text-gray-300" />
                      }
                      <span className={cn("text-xs font-semibold", c.isActive ? "text-[#1a5c14]" : "text-gray-400")}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Code", "Description", "Discount", "Min Order", "Usage", "Valid Until", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((c) => {
                    const expired = isExpired(c.endDate);
                    return (
                      <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                            {c.code}
                          </span>
                        </td>
                        <td className="px-4 py-4 max-w-50">
                          <p className="text-gray-700 line-clamp-1">{c.description || "—"}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold w-fit", TYPE_COLORS[c.type])}>
                              {TYPE_LABELS[c.type]}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {c.type === "percentage" ? `${c.value}%` : c.type === "flat" ? `₹${c.value}` : "—"}
                              {c.maxDiscountAmount ? <span className="text-xs text-gray-400 font-normal ml-1">max ₹{c.maxDiscountAmount}</span> : ""}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                          {c.minOrderAmount > 0 ? `₹${c.minOrderAmount}` : "None"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={cn("text-sm", c.usageLimit && c.usageCount >= c.usageLimit ? "text-red-500 font-semibold" : "text-gray-700")}>
                            {c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : " uses"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={cn("text-sm", expired ? "text-red-500 font-semibold" : "text-gray-700")}>
                            {fmtDate(c.endDate)}{expired ? " (Expired)" : ""}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button onClick={() => handleToggle(c)} className="flex items-center gap-1.5 text-sm">
                            {c.isActive
                              ? <ToggleRight className="h-6 w-6 text-[#1a5c14]" />
                              : <ToggleLeft  className="h-6 w-6 text-gray-300" />
                            }
                            <span className={c.isActive ? "text-[#1a5c14] font-semibold" : "text-gray-400"}>
                              {c.isActive ? "Active" : "Inactive"}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setModal(c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(c._id)} disabled={deleting === c._id} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50" title="Delete">
                              {deleting === c._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
