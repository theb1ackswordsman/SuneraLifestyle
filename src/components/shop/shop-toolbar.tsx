"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShopToolbarProps {
  total: number;
  className?: string;
  onMobileFilter?: () => void;
}

const SORT_OPTIONS = [
  { value: "featured",   label: "Featured"      },
  { value: "newest",     label: "Newest First"  },
  { value: "price-asc",  label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "rating",     label: "Highest Rated" },
  { value: "popular",    label: "Most Popular"  },
];

export function ShopToolbar({ total, className, onMobileFilter }: ShopToolbarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();
  const [, startTransition] = useTransition();

  const activeSort = params.get("sort") ?? "featured";

  function setSort(value: string) {
    const next = new URLSearchParams(params.toString());
    next.set("sort", value);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{total.toLocaleString()}</span> products
      </p>

      <div className="flex items-center gap-3">
        {/* Mobile filter button */}
        <button
          onClick={onMobileFilter}
          className="flex lg:hidden items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:border-brand-emerald transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>

        {/* Sort */}
        <div className="relative">
          <select
            value={activeSort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none rounded-xl border border-border bg-background py-2 pl-4 pr-9 text-sm font-medium outline-none focus:border-brand-emerald cursor-pointer hover:border-brand-emerald/50 transition-colors"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
