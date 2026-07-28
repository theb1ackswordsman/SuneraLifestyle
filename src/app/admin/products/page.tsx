"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Package, Plus, Search, Pencil, Trash2,
  ChevronLeft, ChevronRight, Loader2, Star, Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice?: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  images?: string[];
  category?: { name: string; slug: string };
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [toggling, setToggling]     = useState<string | null>(null);
  const [deleteErr, setDeleteErr]   = useState("");

  const [fetchErr, setFetchErr]     = useState(false);

  const load = useCallback((isRetry = false) => {
    setLoading(true);
    setFetchErr(false);
    const q = new URLSearchParams({ page: String(page), ...(search && { search }) });
    fetch(`/api/admin/products?${q}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setProducts(json.data.products ?? []);
          setTotal(json.data.total ?? 0);
          setTotalPages(json.data.totalPages ?? 1);
        } else {
          setFetchErr(true);
        }
      })
      .catch(() => {
        if (!isRetry) {
          setTimeout(() => load(true), 1000);
        } else {
          setFetchErr(true);
        }
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    setDeleteErr("");
    try {
      const res  = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteErr(json.error ?? `Failed to delete (${res.status}). Please try again.`);
      } else {
        load();
      }
    } catch {
      setDeleteErr("Network error. Please check your connection and try again.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggle(id: string, field: "isFeatured" | "isBestSeller", current: boolean) {
    setToggling(`${id}-${field}`);
    await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !current }),
    });
    setToggling(null);
    load();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {fetchErr && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-between gap-3 shadow-xs">
          <span>Failed to connect or fetch products. Server may be starting up.</span>
          <button onClick={() => load(true)} className="shrink-0 font-bold underline hover:text-amber-900">Retry Now</button>
        </div>
      )}
      {deleteErr && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{deleteErr}</span>
          <button onClick={() => setDeleteErr("")} className="shrink-0 text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-[#1a5c14] shrink-0" />
          <div>
            <h1 className="text-xl font-black text-gray-900">Products</h1>
            <p className="text-xs text-gray-500">{total} total products</p>
          </div>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-[#1a5c14] hover:bg-[#103a0c] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products…"
          className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]"
        />
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))
        ) : products.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
            No products found.{" "}
            <Link href="/admin/products/new" className="text-[#1a5c14] font-semibold hover:underline">Add one</Link>
          </div>
        ) : (
          products.map((p) => (
            <div key={p._id} className="rounded-2xl border border-gray-200 bg-white p-3.5 sm:p-4 space-y-3 shadow-sm">
              {/* Top Row: Image + Name + Category + Active status */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.name} className="h-14 w-14 shrink-0 rounded-xl object-cover border border-gray-100 bg-gray-50" />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300 text-xs font-semibold">N/A</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{p.category?.name ?? "Uncategorized"}</p>
                  </div>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", p.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                  {p.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Middle Row: Price & Stock bar */}
              <div className="flex items-center justify-between rounded-xl bg-gray-50/80 border border-gray-100 px-3 py-2 text-xs">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-extrabold text-gray-900 text-sm">₹{p.basePrice?.toLocaleString("en-IN")}</span>
                  {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                    <span className="text-[11px] text-gray-400 line-through">₹{p.compareAtPrice.toLocaleString("en-IN")}</span>
                  )}
                </div>
                <span className={cn("font-bold text-xs", p.stock === 0 ? "text-red-600" : p.stock < 10 ? "text-amber-600" : "text-gray-600")}>
                  Stock: {p.stock}
                </span>
              </div>

              {/* Bottom Row: Featured / Best Seller Toggles & Edit/Delete Actions */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleToggle(p._id, "isFeatured", p.isFeatured)}
                    disabled={toggling === `${p._id}-isFeatured`}
                    title={p.isFeatured ? "Featured" : "Mark Featured"}
                    className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors whitespace-nowrap", p.isFeatured ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}
                  >
                    <Star className={cn("h-3 w-3 shrink-0", p.isFeatured && "fill-amber-500")} />
                    <span>Featured</span>
                  </button>
                  <button
                    onClick={() => handleToggle(p._id, "isBestSeller", p.isBestSeller)}
                    disabled={toggling === `${p._id}-isBestSeller`}
                    title={p.isBestSeller ? "Best Seller" : "Mark Best Seller"}
                    className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors whitespace-nowrap", p.isBestSeller ? "bg-green-100 text-[#1a5c14] border border-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}
                  >
                    <Trophy className={cn("h-3 w-3 shrink-0", p.isBestSeller && "fill-[#1a5c14]")} />
                    <span>Best Seller</span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link href={`/admin/products/${p._id}/edit`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-[#1a5c14] hover:border-[#1a5c14] hover:text-white transition-colors"
                    title="Edit Product">
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(p._id, p.name)}
                    disabled={deleting === p._id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Delete Product"
                  >
                    {deleting === p._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
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
                <th className="px-4 py-3.5 font-semibold text-gray-500 uppercase text-xs tracking-wider w-14">Image</th>
                <th className="px-4 py-3.5 font-semibold text-gray-500 uppercase text-xs tracking-wider">Product</th>
                <th className="px-4 py-3.5 font-semibold text-gray-500 uppercase text-xs tracking-wider">Category</th>
                <th className="px-4 py-3.5 font-semibold text-gray-500 uppercase text-xs tracking-wider">Price</th>
                <th className="px-4 py-3.5 font-semibold text-gray-500 uppercase text-xs tracking-wider">Stock</th>
                <th className="px-4 py-3.5 font-semibold text-gray-500 uppercase text-xs tracking-wider text-center">Featured</th>
                <th className="px-4 py-3.5 font-semibold text-gray-500 uppercase text-xs tracking-wider text-center">Best Seller</th>
                <th className="px-4 py-3.5 font-semibold text-gray-500 uppercase text-xs tracking-wider">Status</th>
                <th className="px-4 py-3.5 font-semibold text-gray-500 uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    No products found.{" "}
                    <Link href="/admin/products/new" className="text-[#1a5c14] font-semibold hover:underline">
                      Add your first product
                    </Link>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="h-10 w-10 rounded-lg object-cover border border-gray-100 bg-gray-50"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300 text-[10px]">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600 text-sm">{p.category?.name ?? "—"}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">₹{p.basePrice?.toLocaleString("en-IN")}</p>
                      {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                        <p className="text-xs text-gray-400 line-through">₹{p.compareAtPrice.toLocaleString("en-IN")}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("font-semibold text-sm", p.stock === 0 ? "text-red-600" : p.stock < 10 ? "text-yellow-600" : "text-gray-900")}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggle(p._id, "isFeatured", p.isFeatured)}
                        disabled={toggling === `${p._id}-isFeatured`}
                        title={p.isFeatured ? "Remove from featured" : "Mark as featured"}
                        className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                          p.isFeatured ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-500"
                        )}
                      >
                        {toggling === `${p._id}-isFeatured`
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Star className={cn("h-3.5 w-3.5", p.isFeatured && "fill-amber-500")} />}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggle(p._id, "isBestSeller", p.isBestSeller)}
                        disabled={toggling === `${p._id}-isBestSeller`}
                        title={p.isBestSeller ? "Remove bestseller" : "Mark as bestseller"}
                        className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                          p.isBestSeller ? "bg-green-100 text-[#1a5c14] hover:bg-green-200" : "bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600"
                        )}
                      >
                        {toggling === `${p._id}-isBestSeller`
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trophy className={cn("h-3.5 w-3.5", p.isBestSeller && "fill-[#1a5c14]")} />}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("rounded px-2 py-0.5 text-[11px] font-bold uppercase", p.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/products/${p._id}/edit`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-[#1a5c14] hover:border-[#1a5c14] hover:text-white transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p._id, p.name)}
                          disabled={deleting === p._id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {deleting === p._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">Page {page} of {totalPages} · {total} products</p>
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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
