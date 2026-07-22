"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition, useState, useEffect } from "react";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { CategoryItem } from "@/lib/shop/query-categories";

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span className={cn(
      "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
      checked ? "border-brand-emerald bg-brand-emerald" : "border-border bg-background"
    )}>
      {checked && (
        <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

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

export function FiltersSidebar({ categories, className }: FiltersSidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [minInput, setMinInput] = useState(params.get("minPrice") ?? "");
  const [maxInput, setMaxInput] = useState(params.get("maxPrice") ?? "");

  const activeType     = params.get("type")     ?? "";
  const activeCategory = params.get("category") ?? "";
  const activeBadge    = params.get("badge")    ?? "";
  const activeSize     = params.get("size")     ?? "";

  // Which top-level categories are expanded (the active one + any manually opened)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(activeType ? [activeType] : []));

  // Sizes — fetched from API when a category/type is active
  const [sizes, setSizes] = useState<string[]>([]);
  useEffect(() => {
    if (!activeType && !activeCategory) { setSizes([]); return; }
    const qs = activeCategory ? `category=${activeCategory}` : `type=${activeType}`;
    fetch(`/api/sizes?${qs}`)
      .then((r) => r.json())
      .then((j) => setSizes(j.data ?? []))
      .catch(() => setSizes([]));
  }, [activeType, activeCategory]);

  const push = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      next.delete("page");
      startTransition(() => router.push(`${pathname}?${next.toString()}`));
    },
    [params, pathname, router]
  );

  function selectType(slug: string) {
    // Toggle expand/collapse
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    // Update URL — select this type, clear subcategory
    push({ type: slug, category: null });
  }

  function selectSubCategory(subSlug: string, parentSlug: string) {
    push({ type: parentSlug, category: subSlug });
  }

  function applyPrice() {
    push({ minPrice: minInput || null, maxPrice: maxInput || null });
  }

  function clearAll() {
    setMinInput("");
    setMaxInput("");
    setExpanded(new Set());
    startTransition(() => router.push(pathname));
  }

  const hasFilters = !!(activeType || activeCategory || activeBadge || activeSize || params.get("minPrice") || params.get("maxPrice"));

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
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</p>

        {/* All Products */}
        <button
          onClick={() => { setExpanded(new Set()); push({ type: null, category: null }); }}
          className={cn(
            "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors mb-0.5",
            !activeType && !activeCategory
              ? "font-semibold text-brand-emerald"
              : "text-foreground/70 hover:bg-muted hover:text-foreground"
          )}
        >
          <Checkbox checked={!activeType && !activeCategory} />
          All Products
        </button>

        {/* Top-level categories */}
        <ul className="space-y-0.5 mt-1">
          {categories.map((cat) => {
            const isActive   = activeType === cat.slug;
            const isExpanded = expanded.has(cat.slug);
            const hasSubs    = cat.subcategories.length > 0;

            return (
              <li key={cat._id}>
                {/* Parent row */}
                <button
                  onClick={() => selectType(cat.slug)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    isActive ? "text-brand-emerald" : "text-foreground hover:bg-muted"
                  )}
                >
                  <Checkbox checked={isActive && !activeCategory} />
                  <span className="flex-1 text-left">{cat.name}</span>
                  {hasSubs && (
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )} />
                  )}
                </button>

                {/* Subcategories — show when expanded */}
                {hasSubs && isExpanded && (
                  <ul className="mt-0.5 mb-1 space-y-0.5 pl-3">
                    {cat.subcategories.map((sub) => {
                      const subActive = activeCategory === sub.slug;
                      return (
                        <li key={sub._id}>
                          <button
                            onClick={() => selectSubCategory(sub.slug, cat.slug)}
                            className={cn(
                              "w-full flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                              subActive
                                ? "font-semibold text-brand-emerald"
                                : "text-foreground/65 hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <Checkbox checked={subActive} />
                            <span className="flex-1 text-left">{sub.name}</span>
                            {sub.productCount > 0 && (
                              <span className="text-xs text-muted-foreground">{sub.productCount}</span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
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
        <Button variant="outline" size="sm" onClick={applyPrice} className="mt-2 w-full rounded-lg text-xs">
          Apply Price
        </Button>
      </div>

      {/* Size filter — only shown when sizes exist for the selected category */}
      {sizes.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => push({ size: activeSize === s ? null : s })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  activeSize === s
                    ? "border-brand-emerald bg-brand-emerald/10 text-brand-emerald font-semibold"
                    : "border-border text-foreground/70 hover:border-brand-emerald hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product Type badges */}
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
                <span className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors shrink-0",
                  activeBadge === opt.value ? "border-brand-emerald bg-brand-emerald" : "border-border"
                )}>
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
    </aside>
  );
}
