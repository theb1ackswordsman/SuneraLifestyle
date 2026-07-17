"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition, useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { CategoryItem } from "@/lib/shop/query-categories";

interface FiltersSidebarProps {
  categories: CategoryItem[];
  className?: string;
}

type BadgeFilter = "new" | "bestseller" | "sale";

const BADGE_OPTIONS: { value: BadgeFilter; label: string }[] = [
  { value: "new",        label: "New Arrivals" },
  { value: "bestseller", label: "Bestsellers"  },
  { value: "sale",       label: "On Sale"      },
];

const RATING_OPTIONS = [
  { value: "4", label: "4★ & above" },
  { value: "3", label: "3★ & above" },
];

export function FiltersSidebar({ categories, className }: FiltersSidebarProps) {
  const router    = useRouter();
  const pathname  = usePathname();
  const params    = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [minInput, setMinInput] = useState(params.get("minPrice") ?? "");
  const [maxInput, setMaxInput] = useState(params.get("maxPrice") ?? "");

  const activeCategory = params.get("category") ?? "";
  const activeBadge    = params.get("badge") ?? "";

  const push = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      next.delete("page"); // reset to page 1 on filter change
      startTransition(() => router.push(`${pathname}?${next.toString()}`));
    },
    [params, pathname, router]
  );

  function applyPrice() {
    push({ minPrice: minInput || null, maxPrice: maxInput || null });
  }

  function clearAll() {
    setMinInput("");
    setMaxInput("");
    startTransition(() => router.push(pathname));
  }

  const hasFilters = !!(activeCategory || activeBadge || params.get("minPrice") || params.get("maxPrice"));

  return (
    <aside className={cn("space-y-6", pending && "opacity-60 pointer-events-none transition-opacity", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-bold uppercase tracking-wider">Filters</span>
        </div>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-semibold text-brand-emerald hover:underline"
          >
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</p>
        <ul className="space-y-0.5">
          <li>
            <button
              onClick={() => push({ category: null })}
              className={cn(
                "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                !activeCategory
                  ? "bg-brand-emerald/10 font-semibold text-brand-emerald"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              )}
            >
              <span>All Products</span>
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.slug}>
              <button
                onClick={() => push({ category: cat.slug })}
                className={cn(
                  "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  activeCategory === cat.slug
                    ? "bg-brand-emerald/10 font-semibold text-brand-emerald"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <span>{cat.name}</span>
                {cat.productCount > 0 && (
                  <span className="text-xs text-muted-foreground">{cat.productCount}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Range (₹)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            min={0}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/30"
          />
          <span className="text-muted-foreground text-xs">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            min={0}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/30"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={applyPrice}
          className="mt-2 w-full rounded-lg text-xs"
        >
          Apply Price
        </Button>
      </div>

      {/* Badge */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Type</p>
        <ul className="space-y-0.5">
          {BADGE_OPTIONS.map((opt) => (
            <li key={opt.value}>
              <button
                onClick={() => push({ badge: activeBadge === opt.value ? null : opt.value })}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  activeBadge === opt.value
                    ? "bg-brand-emerald/10 font-semibold text-brand-emerald"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors",
                    activeBadge === opt.value
                      ? "border-brand-emerald bg-brand-emerald"
                      : "border-border"
                  )}
                >
                  {activeBadge === opt.value && (
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Rating */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Min Rating</p>
        <ul className="space-y-0.5">
          {RATING_OPTIONS.map((opt) => {
            const active = params.get("rating") === opt.value;
            return (
              <li key={opt.value}>
                <button
                  onClick={() => push({ rating: active ? null : opt.value })}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-brand-emerald/10 font-semibold text-brand-emerald"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="text-amber-400">{"★".repeat(parseInt(opt.value))}</span>
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
