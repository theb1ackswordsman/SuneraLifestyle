"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), ...(search && { search }) });
    fetch(`/api/admin/customers?${q}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setCustomers(json.data.customers);
          setTotal(json.data.total);
          setTotalPages(json.data.totalPages);
        }
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a5c14]/10 shrink-0">
          <Users className="h-5 w-5 text-[#1a5c14]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Customers</h1>
          <p className="text-xs text-gray-500">{total} registered customers</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search customers…"
          className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]"
        />
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))
        ) : customers.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-400 text-sm">
            No customers found.
          </div>
        ) : (
          customers.map((c) => (
            <div key={c._id} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", c.isEmailVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                    {c.isEmailVerified ? "Verified" : "Unverified"}
                  </span>
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                    {c.isActive ? "Active" : "Blocked"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{c.phone ?? "No phone"}</span>
                <span>Joined {fmtDate(c.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                {["Name", "Email", "Phone", "Verified", "Status", "Joined"].map((h) => (
                  <th key={h} className="px-5 py-3.5 font-semibold text-gray-500 uppercase text-xs tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 w-full animate-pulse rounded bg-gray-100" /></td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No customers found.</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">{c.name}</td>
                    <td className="px-5 py-4 text-gray-600">{c.email}</td>
                    <td className="px-5 py-4 text-gray-600">{c.phone ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span className={cn("rounded px-2 py-0.5 text-[11px] font-bold uppercase", c.isEmailVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                        {c.isEmailVerified ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("rounded px-2 py-0.5 text-[11px] font-bold uppercase", c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {c.isActive ? "Active" : "Blocked"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile pagination */}
      {totalPages > 1 && (
        <div className="flex sm:hidden items-center justify-between">
          <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
