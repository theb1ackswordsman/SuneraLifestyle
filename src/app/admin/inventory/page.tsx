"use client";

import { useEffect, useState, useCallback, useRef, Fragment } from "react";
import {
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pencil,
  Check,
  X,
  Layers,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryVariant {
  sku: string;
  size?: string;
  stock: number;
  price?: number;
}

interface InventoryProduct {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  stock: number;
  basePrice: number;
  isActive: boolean;
  images: string[];
  category?: { name: string; slug: string };
  variants?: InventoryVariant[];
}

type StockStatus = "all" | "in_stock" | "low_stock" | "out_of_stock";

interface SummaryStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOW_STOCK_THRESHOLD = 10;

const ADMIN_HEADERS = {
  "Content-Type": "application/json",
  "x-user-role": "admin",
  "x-admin-verified": "1",
};

const STATUS_TABS: { value: StockStatus; label: string }[] = [
  { value: "all",          label: "All" },
  { value: "in_stock",     label: "In Stock" },
  { value: "low_stock",    label: "Low Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStockStatus(stock: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (stock === 0)                               return "out_of_stock";
  if (stock > 0 && stock <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StockBadge({ stock }: { stock: number }) {
  const status = getStockStatus(stock);
  if (status === "out_of_stock") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
        <XCircle className="h-3 w-3" /> Out of Stock
      </span>
    );
  }
  if (status === "low_stock") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
        <AlertTriangle className="h-3 w-3" /> Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
      <CheckCircle2 className="h-3 w-3" /> In Stock
    </span>
  );
}

function SummaryCard({ label, value, colorClass, icon }: {
  label: string; value: number; colorClass: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", colorClass)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black text-gray-900">{value.toLocaleString("en-IN")}</p>
        <p className="truncate text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// ─── Product-level stock editor ───────────────────────────────────────────────

interface StockCellProps {
  product: InventoryProduct;
  isEditing: boolean;
  onBeginEdit: (key: string) => void;
  onSaved: (id: string, newStock: number) => void;
  onCancel: () => void;
}

function StockCell({ product, isEditing, onBeginEdit, onSaved, onCancel }: StockCellProps) {
  const [value, setValue]   = useState(String(product.stock));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const inputRef            = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setValue(String(product.stock));
      setError("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing, product.stock]);

  async function save() {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) { setError("Must be ≥ 0"); return; }
    setSaving(true); setError("");
    try {
      const res  = await fetch("/api/admin/inventory", {
        method: "PATCH", headers: ADMIN_HEADERS,
        body:   JSON.stringify({ productId: product._id, stock: parsed }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error ?? "Failed to save"); return; }
      onSaved(product._id, parsed);
    } catch { setError("Network error"); }
    finally  { setSaving(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter")  save();
    if (e.key === "Escape") onCancel();
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold tabular-nums text-gray-900">{product.stock}</span>
        <button onClick={() => onBeginEdit(product._id)} aria-label="Edit stock"
          className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-[#1a5c14] transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <input ref={inputRef} type="number" min={0} value={value}
          onChange={(e) => setValue(e.target.value)} onKeyDown={handleKeyDown} disabled={saving}
          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-900 focus:border-[#1a5c14] focus:outline-none disabled:opacity-50" />
        <button onClick={save} disabled={saving} aria-label="Save"
          className="flex h-7 w-7 items-center justify-center rounded bg-[#1a5c14] text-white hover:bg-[#14470f] disabled:opacity-50 transition-colors">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={onCancel} disabled={saving} aria-label="Cancel"
          className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

// ─── Variant-level stock editor ───────────────────────────────────────────────

interface VariantStockCellProps {
  productId: string;
  variant: InventoryVariant;
  isEditing: boolean;
  onBeginEdit: (key: string) => void;
  onSaved: (productId: string, variantSku: string, newVariantStock: number, newProductStock: number) => void;
  onCancel: () => void;
}

function VariantStockCell({ productId, variant, isEditing, onBeginEdit, onSaved, onCancel }: VariantStockCellProps) {
  const [value, setValue]   = useState(String(variant.stock));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const inputRef            = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setValue(String(variant.stock));
      setError("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing, variant.stock]);

  async function save() {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) { setError("Must be ≥ 0"); return; }
    setSaving(true); setError("");
    try {
      const res  = await fetch("/api/admin/inventory", {
        method: "PATCH", headers: ADMIN_HEADERS,
        body:   JSON.stringify({ productId, variantSku: variant.sku, stock: parsed }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error ?? "Failed to save"); return; }
      onSaved(productId, variant.sku, parsed, json.data.productStock);
    } catch { setError("Network error"); }
    finally  { setSaving(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter")  save();
    if (e.key === "Escape") onCancel();
  }

  const editKey = `${productId}::${variant.sku}`;

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold tabular-nums text-gray-900">{variant.stock}</span>
        <button onClick={() => onBeginEdit(editKey)} aria-label="Edit variant stock"
          className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-[#1a5c14] transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <input ref={inputRef} type="number" min={0} value={value}
          onChange={(e) => setValue(e.target.value)} onKeyDown={handleKeyDown} disabled={saving}
          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-900 focus:border-[#1a5c14] focus:outline-none disabled:opacity-50" />
        <button onClick={save} disabled={saving} aria-label="Save"
          className="flex h-7 w-7 items-center justify-center rounded bg-[#1a5c14] text-white hover:bg-[#14470f] disabled:opacity-50 transition-colors">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={onCancel} disabled={saving} aria-label="Cancel"
          className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminInventoryPage() {
  const [products, setProducts]         = useState<InventoryProduct[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatus]       = useState<StockStatus>("all");
  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [editingKey, setEditingKey]     = useState<string | null>(null);
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [stats, setStats]               = useState<SummaryStats>({
    total: 0, inStock: 0, lowStock: 0, outOfStock: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => { setDebounced(search); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStats = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/inventory?limit=9999", { headers: ADMIN_HEADERS });
      const json = await res.json();
      if (json.success) {
        const all: InventoryProduct[] = json.data.products;
        setStats({
          total:      json.data.total,
          inStock:    all.filter((p) => getStockStatus(p.stock) === "in_stock").length,
          lowStock:   all.filter((p) => getStockStatus(p.stock) === "low_stock").length,
          outOfStock: all.filter((p) => getStockStatus(p.stock) === "out_of_stock").length,
        });
      }
    } catch { /* stats non-critical */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: String(page), limit: "30",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(debouncedSearch && { q: debouncedSearch }),
      });
      const res  = await fetch(`/api/admin/inventory?${q}`, { headers: ADMIN_HEADERS });
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.products);
        setTotal(json.data.total);
        setTotalPages(json.data.totalPages);
      }
    } finally { setLoading(false); }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => { load(); fetchStats(); }, [load, fetchStats]);

  function handleStockSaved(id: string, newStock: number) {
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, stock: newStock } : p)));
    setEditingKey(null);
    fetchStats();
  }

  function handleVariantStockSaved(productId: string, variantSku: string, newVariantStock: number, newProductStock: number) {
    setProducts((prev) => prev.map((p) => {
      if (p._id !== productId) return p;
      return {
        ...p,
        stock: newProductStock,
        variants: (p.variants ?? []).map((v) => v.sku === variantSku ? { ...v, stock: newVariantStock } : v),
      };
    }));
    setEditingKey(null);
    fetchStats();
  }

  function handleStatusTab(value: StockStatus) {
    setStatus(value); setPage(1); setEditingKey(null); setExpandedId(null);
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
    setEditingKey(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a5c14]/10">
          <Package className="h-5 w-5 text-[#1a5c14]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Inventory</h1>
          <p className="text-xs text-gray-500">Manage how many units you have — click &quot;Sizes&quot; to update each size separately</p>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total Products" value={stats.total}      colorClass="bg-[#1a5c14]/10" icon={<Package      className="h-5 w-5 text-[#1a5c14]"  />} />
        <SummaryCard label="In Stock"       value={stats.inStock}    colorClass="bg-green-100"   icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} />
        <SummaryCard label="Low Stock"      value={stats.lowStock}   colorClass="bg-amber-100"   icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} />
        <SummaryCard label="Out of Stock"   value={stats.outOfStock} colorClass="bg-red-100"     icon={<XCircle      className="h-5 w-5 text-red-600"   />} />
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="search" placeholder="Search by product name or code…" value={search}
            onChange={(e) => { setSearch(e.target.value); setEditingKey(null); }}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#1a5c14] focus:outline-none" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
          {STATUS_TABS.map(({ value, label }) => (
            <button key={value} onClick={() => handleStatusTab(value)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors",
                statusFilter === value
                  ? "bg-[#1a5c14] border-[#1a5c14] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mobile card list ── */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            No products found.
          </div>
        ) : (
          products.map((p) => (
            <div key={p._id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {p.images[0] ? (
                      <Image src={p.images[0]} alt={p.name} fill sizes="48px" className="object-cover" />
                    ) : (
                      <Package className="absolute inset-0 m-auto h-5 w-5 text-gray-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900 text-sm">{p.name}</p>
                    <p className="text-[11px] text-gray-400">Code: {p.sku}</p>
                    <p className="text-[11px] text-gray-400">{p.category?.name ?? "—"}</p>
                  </div>
                  <StockBadge stock={p.stock} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">₹{p.basePrice.toLocaleString("en-IN")}</span>
                  {p.variants && p.variants.length > 0 ? (
                    <button onClick={() => toggleExpand(p._id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-[#1a5c14] hover:text-[#1a5c14] transition-colors">
                      <Layers className="h-3 w-3" />
                      {p.variants.length} sizes
                      {expandedId === p._id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  ) : (
                    <StockCell
                      product={p}
                      isEditing={editingKey === p._id}
                      onBeginEdit={setEditingKey}
                      onSaved={handleStockSaved}
                      onCancel={() => setEditingKey(null)}
                    />
                  )}
                </div>
              </div>

              {/* Mobile variant rows */}
              {expandedId === p._id && p.variants && p.variants.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50 divide-y divide-gray-100">
                  {p.variants.map((v) => {
                    const vKey = `${p._id}::${v.sku}`;
                    return (
                      <div key={v.sku} className="flex items-center justify-between px-4 py-2.5">
                        <div>
                          <span className="text-sm font-semibold text-gray-800">{v.size ?? v.sku}</span>
                          {v.price && <span className="ml-2 text-xs text-gray-400">₹{v.price.toLocaleString("en-IN")}</span>}
                          <p className="text-[10px] text-gray-400 mt-0.5">Code: {v.sku}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StockBadge stock={v.stock} />
                          <VariantStockCell
                            productId={p._id}
                            variant={v}
                            isEditing={editingKey === vKey}
                            onBeginEdit={setEditingKey}
                            onSaved={handleVariantStockSaved}
                            onCancel={() => setEditingKey(null)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden sm:block rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 w-full animate-pulse rounded bg-gray-100" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">No products found.</td>
                </tr>
              ) : (
                products.map((p) => {
                  const hasVariants = Boolean(p.variants && p.variants.length > 0);
                  const isExpanded  = expandedId === p._id;
                  return (
                    <Fragment key={p._id}>
                      <tr
                        className={cn(
                          "transition-colors",
                          editingKey === p._id ? "bg-[#1a5c14]/5" : "hover:bg-gray-50/50"
                        )}>
                        {/* Product */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                              {p.images[0] ? (
                                <Image src={p.images[0]} alt={p.name} fill sizes="40px" className="object-cover" />
                              ) : (
                                <Package className="absolute inset-0 m-auto h-4 w-4 text-gray-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-50 truncate font-semibold text-gray-900">{p.name}</p>
                              <p className="text-[11px] text-gray-400">Code: {p.sku}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {p.category?.name ?? <span className="text-gray-400">—</span>}
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                          ₹{p.basePrice.toLocaleString("en-IN")}
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-3.5">
                          {hasVariants ? (
                            <span className="text-sm font-semibold text-gray-900 tabular-nums">{p.stock} <span className="text-[11px] font-normal text-gray-400">total</span></span>
                          ) : (
                            <StockCell
                              product={p}
                              isEditing={editingKey === p._id}
                              onBeginEdit={setEditingKey}
                              onSaved={handleStockSaved}
                              onCancel={() => setEditingKey(null)}
                            />
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5"><StockBadge stock={p.stock} /></td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          {hasVariants ? (
                            <button onClick={() => toggleExpand(p._id)}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                                isExpanded
                                  ? "border-[#1a5c14] bg-[#1a5c14]/5 text-[#1a5c14]"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-[#1a5c14] hover:text-[#1a5c14]"
                              )}>
                              <Layers className="h-3 w-3" />
                              {p.variants!.length} Sizes
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                          ) : editingKey === p._id ? (
                            <span className="text-xs text-gray-400 italic">editing…</span>
                          ) : (
                            <button onClick={() => setEditingKey(p._id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-[#1a5c14] hover:text-[#1a5c14] transition-colors">
                              <Pencil className="h-3 w-3" /> Edit Stock
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Variant sub-rows */}
                      {isExpanded && hasVariants && p.variants!.map((v) => {
                        const vKey = `${p._id}::${v.sku}`;
                        return (
                          <tr key={vKey} className="bg-gray-50/60 border-l-2 border-[#1a5c14]/20">
                            {/* Product (indented variant label) */}
                            <td className="pl-16 pr-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#1a5c14]/40 shrink-0" />
                                <span className="text-sm font-semibold text-gray-800">{v.size ?? v.sku}</span>
                                <span className="text-[11px] text-gray-400">Code: {v.sku}</span>
                              </div>
                            </td>

                            {/* Category — blank for variant row */}
                            <td className="px-4 py-2.5" />

                            {/* Variant price */}
                            <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">
                              {v.price ? `₹${v.price.toLocaleString("en-IN")}` : <span className="text-gray-400 text-xs">Selling price</span>}
                            </td>

                            {/* Variant stock (editable) */}
                            <td className="px-4 py-2.5">
                              <VariantStockCell
                                productId={p._id}
                                variant={v}
                                isEditing={editingKey === vKey}
                                onBeginEdit={setEditingKey}
                                onSaved={handleVariantStockSaved}
                                onCancel={() => setEditingKey(null)}
                              />
                            </td>

                            {/* Variant status */}
                            <td className="px-4 py-2.5"><StockBadge stock={v.stock} /></td>

                            {/* Actions — blank for variant row */}
                            <td className="px-4 py-2.5">
                              {editingKey === vKey && <span className="text-xs text-gray-400 italic">editing…</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">
              Showing {products.length} of {total} products — Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => { setPage((prev) => prev - 1); setEditingKey(null); }} disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => { setPage((prev) => prev + 1); setEditingKey(null); }} disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
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
            <button onClick={() => { setPage((prev) => prev - 1); setEditingKey(null); }} disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => { setPage((prev) => prev + 1); setEditingKey(null); }} disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
