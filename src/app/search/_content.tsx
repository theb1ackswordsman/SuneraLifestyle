"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, SlidersHorizontal, X, ChevronDown, ChevronLeft, ChevronRight,
  Star, Filter, Check, ArrowUpDown, Package, Zap,
  TrendingUp, AlertCircle, RefreshCw,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchProduct {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice?: number;
  images: string[];
  brand?: string;
  stock: number;
  category: { _id: string; name: string; slug: string };
  reviewSummary: { average: number; count: number };
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  salesCount: number;
  tags: string[];
  discountPct: number;
}

interface FacetCategory { _id: string; name: string; slug: string; count: number }
interface FacetBrand    { name: string; count: number }

interface SearchData {
  products:     SearchProduct[];
  total:        number;
  page:         number;
  totalPages:   number;
  query:        string;
  facets: {
    categories: FacetCategory[];
    priceRange: { min: number; max: number };
    brands:     FacetBrand[];
  };
  responseTimeMs: number;
}

interface TrendingData {
  trending:   string[];
  popular:    string[];
  categories: { name: string; slug: string }[];
}

interface Props {
  initialQ:         string;
  initialPage:      number;
  initialSort:      string;
  initialMinPrice?: number;
  initialMaxPrice?: number;
  initialCategory:  string;
  initialInStock:   boolean;
  initialRating:    number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "relevance",  label: "Most Relevant" },
  { value: "popular",    label: "Best Selling" },
  { value: "newest",     label: "Newest First" },
  { value: "price-asc",  label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating",     label: "Highest Rated" },
  { value: "discount",   label: "Biggest Discount" },
] as const;

const RATING_OPTIONS = [
  { value: 0,   label: "Any" },
  { value: 3,   label: "3★ & up" },
  { value: 3.5, label: "3.5★ & up" },
  { value: 4,   label: "4★ & up" },
  { value: 4.5, label: "4.5★ & up" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function highlight(text: string, q: string): React.ReactNode {
  if (!q.trim()) return text;
  const safe  = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safe})`, "gi"));
  return parts.map((p, i) =>
    new RegExp(safe, "i").test(p)
      ? <mark key={i} className="bg-amber-100 text-amber-900 rounded px-0.5 not-italic font-semibold">{p}</mark>
      : p
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"
          )}
        />
      ))}
      <span className="ml-1 text-xs text-gray-500">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Search Card ──────────────────────────────────────────────────────────────

function SearchCard({
  product,
  query,
  position,
}: {
  product:  SearchProduct;
  query:    string;
  position: number;
}) {
  const router = useRouter();
  const outOfStock = product.stock === 0;
  const lowStock   = product.stock > 0 && product.stock < 5;

  function handleClick() {
    // Non-blocking click tracking
    fetch("/api/search/click", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ query, productId: product._id, slug: product.slug, position }),
    }).catch(() => {/* intentionally silent */});
    router.push(`/product/${product.slug}`);
  }

  const image = product.images[0] ?? "";

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all group overflow-hidden cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-12 w-12 text-gray-200" />
          </div>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="rounded-full bg-gray-800/80 px-3 py-1 text-xs font-bold text-white">
              Out of Stock
            </span>
          </div>
        )}

        {/* Badge strip */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discountPct > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white leading-tight">
              SALE
            </span>
          )}
          {product.isNewArrival && (
            <span className="rounded-full bg-[#1a5c14] px-2 py-0.5 text-[10px] font-bold text-white leading-tight">
              NEW
            </span>
          )}
          {product.isBestSeller && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white leading-tight">
              BESTSELLER
            </span>
          )}
        </div>

        {/* Discount badge */}
        {product.discountPct > 0 && (
          <div className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white leading-tight text-center">
            {product.discountPct}%<br />OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {product.category?.name && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1a5c14]/70 mb-1">
            {product.category.name}
          </p>
        )}

        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-1.5">
          {highlight(product.name, query)}
        </p>

        {product.brand && (
          <p className="text-xs text-gray-400 mb-1.5">{product.brand}</p>
        )}

        {product.reviewSummary.count > 0 && (
          <div className="mb-2">
            <Stars rating={product.reviewSummary.average} />
          </div>
        )}

        {/* Low stock warning */}
        {lowStock && (
          <p className="text-[10px] font-semibold text-orange-500 mb-1.5 flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Only {product.stock} left!
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-black text-gray-900">
            {formatPrice(product.basePrice)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 w-16 bg-gray-100 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="h-5 w-20 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page:       number;
  totalPages: number;
  onChange:   (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  function getPages(): (number | "…")[] {
    const pages: (number | "…")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3)          pages.push("…");
      const start = Math.max(2, page - 1);
      const end   = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("…");
      pages.push(totalPages);
    }
    return pages;
  }

  function go(p: number) {
    onChange(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex items-center justify-center gap-1.5 pt-8">
      <button
        onClick={() => go(page - 1)}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:border-[#1a5c14] hover:text-[#1a5c14] disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getPages().map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-gray-400 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => go(p as number)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-all",
              p === page
                ? "bg-[#1a5c14] text-white shadow-sm shadow-[#1a5c14]/30"
                : "border border-gray-200 text-gray-700 hover:border-[#1a5c14] hover:text-[#1a5c14]"
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:border-[#1a5c14] hover:text-[#1a5c14] disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Filter Panel (shared between sidebar + drawer) ───────────────────────────

interface FilterPanelProps {
  facets:           SearchData["facets"] | null;
  selectedCategory: string;
  minPrice:         number | undefined;
  maxPrice:         number | undefined;
  minRating:        number;
  inStock:          boolean;
  onCategory:       (v: string) => void;
  onMinPrice:       (v: number | undefined) => void;
  onMaxPrice:       (v: number | undefined) => void;
  onRating:         (v: number) => void;
  onInStock:        (v: boolean) => void;
  onClearAll:       () => void;
  onApply?:         () => void;
}

function FilterPanel({
  facets, selectedCategory, minPrice, maxPrice, minRating, inStock,
  onCategory, onMinPrice, onMaxPrice, onRating, onInStock, onClearAll, onApply,
}: FilterPanelProps) {
  const [localMin, setLocalMin] = useState(minPrice?.toString() ?? "");
  const [localMax, setLocalMax] = useState(maxPrice?.toString() ?? "");

  // Sync local when props change
  useEffect(() => { setLocalMin(minPrice?.toString() ?? ""); }, [minPrice]);
  useEffect(() => { setLocalMax(maxPrice?.toString() ?? ""); }, [maxPrice]);

  function applyPrice() {
    const min = localMin ? parseInt(localMin, 10) : undefined;
    const max = localMax ? parseInt(localMax, 10) : undefined;
    onMinPrice(min);
    onMaxPrice(max);
  }

  const brands = facets?.brands?.slice(0, 8) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm">Filters</h3>
        <button
          onClick={onClearAll}
          className="text-xs font-semibold text-[#1a5c14] hover:text-[#15490f] transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Categories */}
      {facets && facets.categories.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Category</p>
          <div className="space-y-1">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="category"
                checked={!selectedCategory}
                onChange={() => onCategory("")}
                className="h-3.5 w-3.5 accent-[#1a5c14]"
              />
              <span className="text-sm text-gray-700 group-hover:text-[#1a5c14] transition-colors">All Categories</span>
            </label>
            {facets.categories.map((cat) => (
              <label key={cat._id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat.slug}
                  onChange={() => onCategory(cat.slug)}
                  className="h-3.5 w-3.5 accent-[#1a5c14]"
                />
                <span className="flex-1 text-sm text-gray-700 group-hover:text-[#1a5c14] transition-colors">
                  {cat.name}
                </span>
                <span className="text-xs text-gray-400">({cat.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Price Range</p>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            placeholder="Min ₹"
            min={0}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
          />
          <span className="text-gray-400 text-sm shrink-0">–</span>
          <input
            type="number"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            placeholder="Max ₹"
            min={0}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
          />
        </div>
        <button
          onClick={applyPrice}
          className="w-full rounded-xl border border-[#1a5c14] text-[#1a5c14] py-2 text-xs font-bold hover:bg-[#1a5c14]/5 transition-colors"
        >
          Apply Price
        </button>
        {(minPrice !== undefined || maxPrice !== undefined) && (
          <button
            onClick={() => { setLocalMin(""); setLocalMax(""); onMinPrice(undefined); onMaxPrice(undefined); }}
            className="mt-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear price filter
          </button>
        )}
      </div>

      {/* Rating */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Minimum Rating</p>
        <div className="space-y-1">
          {RATING_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="rating"
                checked={minRating === opt.value}
                onChange={() => onRating(opt.value)}
                className="h-3.5 w-3.5 accent-[#1a5c14]"
              />
              <span className="text-sm text-gray-700 group-hover:text-[#1a5c14] transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Availability</p>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <div
            className={cn(
              "flex h-4.5 w-4.5 items-center justify-center rounded border-2 transition-all",
              inStock
                ? "border-[#1a5c14] bg-[#1a5c14]"
                : "border-gray-300 group-hover:border-[#1a5c14]/50"
            )}
            style={{ height: 18, width: 18 }}
          >
            {inStock && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
          </div>
          <input type="checkbox" checked={inStock} onChange={(e) => onInStock(e.target.checked)} className="sr-only" />
          <span className="text-sm text-gray-700 group-hover:text-[#1a5c14] transition-colors">In Stock Only</span>
        </label>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Brand</p>
          <div className="space-y-1">
            {brands.map((brand) => (
              <label key={brand.name} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded accent-[#1a5c14]"
                />
                <span className="flex-1 text-sm text-gray-700 group-hover:text-[#1a5c14] transition-colors">
                  {brand.name}
                </span>
                <span className="text-xs text-gray-400">({brand.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {onApply && (
        <button
          onClick={onApply}
          className="w-full rounded-xl bg-[#1a5c14] py-3 text-sm font-bold text-white hover:bg-[#15490f] transition-colors"
        >
          Apply Filters
        </button>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  query,
  onClearFilters,
  hasActiveFilters,
}: {
  query:            string;
  onClearFilters:   () => void;
  hasActiveFilters: boolean;
}) {
  const [trending, setTrending]  = useState<TrendingData | null>(null);
  const [popular,  setPopular]   = useState<SearchProduct[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/search/trending")
      .then((r) => r.json())
      .then((j) => { if (j.success) setTrending(j.data); })
      .catch(() => {/* silent */});

    fetch("/api/search?q=&sort=popular&limit=4")
      .then((r) => r.json())
      .then((j) => { if (j.success) setPopular(j.data.products ?? []); })
      .catch(() => {/* silent */});
  }, []);

  return (
    <div className="py-12 text-center space-y-8">
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Search className="h-8 w-8 text-gray-300" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          No results for &ldquo;{query}&rdquo;
        </h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          {hasActiveFilters
            ? "Try clearing some filters to see more results."
            : "Check your spelling or try a more general search term."}
        </p>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-[#1a5c14] hover:text-[#1a5c14] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Related searches */}
      {trending && (trending.popular.length > 0 || trending.trending.length > 0) && (
        <div className="text-left max-w-lg mx-auto space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Related Searches
          </p>
          <div className="flex flex-wrap gap-2">
            {[...trending.trending, ...trending.popular].slice(0, 10).map((kw) => (
              <button
                key={kw}
                onClick={() => router.push(`/search?q=${encodeURIComponent(kw)}`)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:border-[#1a5c14] hover:text-[#1a5c14] hover:bg-[#1a5c14]/5 transition-all"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular products */}
      {popular.length > 0 && (
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-4">
            <Zap className="h-3.5 w-3.5" />
            Popular Products
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {popular.map((p, i) => (
              <SearchCard key={p._id} product={p} query="" position={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty Query Landing ──────────────────────────────────────────────────────

function EmptyQueryLanding({ onSearch }: { onSearch: (q: string) => void }) {
  const [input,    setInput]    = useState("");
  const [trending, setTrending] = useState<TrendingData | null>(null);
  const [recent,   setRecent]   = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/search/trending")
      .then((r) => r.json())
      .then((j) => { if (j.success) setTrending(j.data); })
      .catch(() => {/* silent */});

    // Only show recent searches if authenticated
    fetch("/api/search/recent")
      .then((r) => { if (r.ok) return r.json(); return null; })
      .then((j) => { if (j?.success && Array.isArray(j.data)) setRecent(j.data.slice(0, 6)); })
      .catch(() => {/* 401 = not logged in, ignore */});
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) onSearch(input.trim());
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 space-y-10 text-center px-4">
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1a5c14]/5">
            <Search className="h-10 w-10 text-[#1a5c14]" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-gray-800">What are you looking for?</h1>
        <p className="text-gray-500 text-sm max-w-md">
          Discover Ayurvedic wellness products, herbal supplements and ethnic wear.
        </p>
      </div>

      {/* Search input */}
      <form onSubmit={submit} className="w-full max-w-lg">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search products…"
            autoFocus
            className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-28 text-base shadow-sm focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 rounded-xl bg-[#1a5c14] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#15490f] transition-colors disabled:opacity-50"
          >
            Go
          </button>
        </div>
      </form>

      {/* Recent searches */}
      {recent.length > 0 && (
        <div className="space-y-3 w-full max-w-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 text-left flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Recent Searches
          </p>
          <div className="flex flex-wrap gap-2">
            {recent.map((kw) => (
              <button
                key={kw}
                onClick={() => onSearch(kw)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:border-[#1a5c14] hover:text-[#1a5c14] hover:bg-[#1a5c14]/5 transition-all"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending searches */}
      {trending && trending.trending.length > 0 && (
        <div className="space-y-3 w-full max-w-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 text-left flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Trending Searches
          </p>
          <div className="flex flex-wrap gap-2">
            {trending.trending.map((kw) => (
              <button
                key={kw}
                onClick={() => onSearch(kw)}
                className="rounded-full bg-[#1a5c14]/5 border border-[#1a5c14]/20 px-3 py-1.5 text-sm font-medium text-[#1a5c14] hover:bg-[#1a5c14]/10 transition-all"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category chips */}
      {trending && trending.categories.length > 0 && (
        <div className="space-y-3 w-full max-w-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 text-left flex items-center gap-2">
            <Package className="h-3.5 w-3.5" />
            Browse Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {trending.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:border-[#1a5c14] hover:text-[#1a5c14] transition-all"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SearchContent({
  initialQ,
  initialPage,
  initialSort,
  initialMinPrice,
  initialMaxPrice,
  initialCategory,
  initialInStock,
  initialRating,
}: Props) {
  const router = useRouter();

  // Search state
  const [q,                setQ]                = useState(initialQ);
  const [page,             setPage]             = useState(initialPage);
  const [sort,             setSort]             = useState(initialSort);
  const [minPrice,         setMinPrice]         = useState<number | undefined>(initialMinPrice);
  const [maxPrice,         setMaxPrice]         = useState<number | undefined>(initialMaxPrice);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [inStock,          setInStock]          = useState(initialInStock);
  const [minRating,        setMinRating]        = useState(initialRating);

  // UI state
  const [results,     setResults]     = useState<SearchData | null>(null);
  const [loading,     setLoading]     = useState(!!initialQ);
  const [error,       setError]       = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen,    setSortOpen]    = useState(false);

  // Prevent URL sync loop
  const skipSyncRef = useRef(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchResults = useCallback(async (opts: {
    q: string; page: number; sort: string;
    minPrice?: number; maxPrice?: number;
    category: string; inStock: boolean; minRating: number;
  }) => {
    if (!opts.q.trim()) { setResults(null); setLoading(false); return; }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ q: opts.q, page: String(opts.page), sort: opts.sort });
      if (opts.minPrice !== undefined) params.set("minPrice", String(opts.minPrice));
      if (opts.maxPrice !== undefined) params.set("maxPrice", String(opts.maxPrice));
      if (opts.category)               params.set("category", opts.category);
      if (opts.inStock)                params.set("inStock", "true");
      if (opts.minRating > 0)          params.set("rating", String(opts.minRating));

      const res  = await fetch(`/api/search?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setResults(json.data);
      } else {
        setError(json.error ?? "Something went wrong.");
      }
    } catch {
      setError("Failed to load results. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Main search effect — when filters change reset page to 1
  useEffect(() => {
    fetchResults({ q, page, sort, minPrice, maxPrice, category: selectedCategory, inStock, minRating });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page, sort, minPrice, maxPrice, selectedCategory, inStock, minRating]);

  // URL sync
  useEffect(() => {
    if (skipSyncRef.current) { skipSyncRef.current = false; return; }

    const params = new URLSearchParams();
    if (q)                               params.set("q",        q);
    if (page > 1)                        params.set("page",     String(page));
    if (sort !== "relevance")            params.set("sort",     sort);
    if (minPrice !== undefined)          params.set("minPrice", String(minPrice));
    if (maxPrice !== undefined)          params.set("maxPrice", String(maxPrice));
    if (selectedCategory)                params.set("category", selectedCategory);
    if (inStock)                         params.set("inStock",  "true");
    if (minRating > 0)                   params.set("rating",   String(minRating));

    const newUrl = `/search${params.toString() ? `?${params.toString()}` : ""}`;
    skipSyncRef.current = true;
    router.replace(newUrl, { scroll: false });
  }, [q, page, sort, minPrice, maxPrice, selectedCategory, inStock, minRating, router]);

  // ── Filter helpers ─────────────────────────────────────────────────────────

  function changeFilter<T>(setter: React.Dispatch<React.SetStateAction<T>>) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  function clearAll() {
    setSelectedCategory("");
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setMinRating(0);
    setInStock(false);
    setPage(1);
  }

  const hasActiveFilters = !!(selectedCategory || minPrice || maxPrice || minRating > 0 || inStock);

  // ── Sort label ─────────────────────────────────────────────────────────────

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

  // ── Filter panel props ─────────────────────────────────────────────────────

  const filterProps: Omit<FilterPanelProps, "onApply"> = {
    facets:           results?.facets ?? null,
    selectedCategory,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    onCategory: changeFilter(setSelectedCategory),
    onMinPrice: changeFilter(setMinPrice),
    onMaxPrice: changeFilter(setMaxPrice),
    onRating:   changeFilter(setMinRating),
    onInStock:  changeFilter(setInStock),
    onClearAll: clearAll,
  };

  // ── Empty query ────────────────────────────────────────────────────────────

  if (!q) {
    return (
      <div className="container-padded pt-28 pb-16">
        <EmptyQueryLanding onSearch={(newQ) => setQ(newQ)} />
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────

  return (
    <div className="container-padded pt-28 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-[#1a5c14] transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/search" className="hover:text-[#1a5c14] transition-colors">Search</Link>
        {q && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-700 font-semibold truncate max-w-50">&ldquo;{q}&rdquo;</span>
          </>
        )}
      </nav>

      {/* Mobile filter toggle */}
      <div className="flex items-center gap-3 mb-5 lg:hidden">
        <button
          onClick={() => setShowFilters(true)}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
            hasActiveFilters
              ? "bg-[#1a5c14]/10 text-[#1a5c14] border-[#1a5c14]/30"
              : "border-gray-200 text-gray-700"
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a5c14] text-[10px] font-bold text-white">
              {[selectedCategory, minPrice, maxPrice, minRating > 0, inStock].filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Sort dropdown (mobile) */}
        <div className="relative ml-auto">
          <button
            onClick={() => setSortOpen((p) => !p)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
          >
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
            {sortLabel}
            <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", sortOpen && "rotate-180")} />
          </button>
          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-1.5 z-30 w-52 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden"
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setPage(1); setSortOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors",
                      opt.value === sort
                        ? "bg-[#1a5c14]/5 text-[#1a5c14] font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {opt.value === sort && <Check className="h-3.5 w-3.5 text-[#1a5c14]" />}
                    <span className={opt.value !== sort ? "ml-6" : ""}>{opt.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Layout */}
      <div className="flex gap-8 items-start">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-28">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <FilterPanel {...filterProps} />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5 gap-4">
            <div className="min-w-0">
              {loading ? (
                <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
              ) : error ? (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              ) : results ? (
                <p className="text-sm text-gray-600">
                  <span className="font-bold text-gray-800">{results.total.toLocaleString("en-IN")}</span>
                  {" "}result{results.total !== 1 ? "s" : ""} for{" "}
                  <span className="font-bold text-gray-800">&ldquo;{results.query}&rdquo;</span>
                  {results.responseTimeMs > 0 && (
                    <span className="ml-1.5 text-gray-400 text-xs">({results.responseTimeMs}ms)</span>
                  )}
                </p>
              ) : null}
            </div>

            {/* Sort (desktop) */}
            <div className="relative hidden lg:block shrink-0">
              <button
                onClick={() => setSortOpen((p) => !p)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-[#1a5c14] hover:text-[#1a5c14] transition-colors"
              >
                <ArrowUpDown className="h-4 w-4 text-gray-400" />
                {sortLabel}
                <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", sortOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-20" onClick={() => setSortOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-1.5 z-30 w-52 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSort(opt.value); setPage(1); setSortOpen(false); }}
                          className={cn(
                            "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors",
                            opt.value === sort
                              ? "bg-[#1a5c14]/5 text-[#1a5c14] font-semibold"
                              : "text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          {opt.value === sort && <Check className="h-3.5 w-3.5 text-[#1a5c14]" />}
                          <span className={opt.value !== sort ? "ml-6" : ""}>{opt.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategory && (
                <span className="flex items-center gap-1.5 rounded-full bg-[#1a5c14]/10 text-[#1a5c14] border border-[#1a5c14]/30 px-3 py-1 text-xs font-semibold">
                  Category: {results?.facets.categories.find((c) => c.slug === selectedCategory)?.name ?? selectedCategory}
                  <button onClick={() => changeFilter(setSelectedCategory)("")} className="ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(minPrice !== undefined || maxPrice !== undefined) && (
                <span className="flex items-center gap-1.5 rounded-full bg-[#1a5c14]/10 text-[#1a5c14] border border-[#1a5c14]/30 px-3 py-1 text-xs font-semibold">
                  Price: {minPrice !== undefined ? formatPrice(minPrice) : "₹0"} – {maxPrice !== undefined ? formatPrice(maxPrice) : "∞"}
                  <button onClick={() => { changeFilter(setMinPrice)(undefined); changeFilter(setMaxPrice)(undefined); }} className="ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {minRating > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-[#1a5c14]/10 text-[#1a5c14] border border-[#1a5c14]/30 px-3 py-1 text-xs font-semibold">
                  {minRating}★ & up
                  <button onClick={() => changeFilter(setMinRating)(0)} className="ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {inStock && (
                <span className="flex items-center gap-1.5 rounded-full bg-[#1a5c14]/10 text-[#1a5c14] border border-[#1a5c14]/30 px-3 py-1 text-xs font-semibold">
                  In Stock
                  <button onClick={() => changeFilter(setInStock)(false)} className="ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAll}
                className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
              <p className="font-semibold text-red-700">{error}</p>
              <button
                onClick={() => fetchResults({ q, page, sort, minPrice, maxPrice, category: selectedCategory, inStock, minRating })}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          )}

          {/* Results or empty state */}
          {!loading && !error && results && (
            results.products.length === 0 ? (
              <EmptyState
                query={results.query}
                onClearFilters={clearAll}
                hasActiveFilters={hasActiveFilters}
              />
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {results.products.map((product, i) => (
                    <SearchCard
                      key={product._id}
                      product={product}
                      query={q}
                      position={(page - 1) * results.products.length + i + 1}
                    />
                  ))}
                </div>

                <Pagination
                  page={results.page}
                  totalPages={results.totalPages}
                  onChange={setPage}
                />
              </>
            )
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowFilters(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] bg-white shadow-2xl overflow-y-auto"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[#1a5c14]" />
                  <h2 className="font-bold text-gray-800">Filter & Refine</h2>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              {/* Filter content */}
              <div className="p-5">
                <FilterPanel
                  {...filterProps}
                  onApply={() => setShowFilters(false)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sort backdrop for desktop */}
      {sortOpen && (
        <div className="fixed inset-0 z-10 lg:hidden" onClick={() => setSortOpen(false)} />
      )}
    </div>
  );
}
