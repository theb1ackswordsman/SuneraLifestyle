"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { FiltersSidebar } from "./filters-sidebar";
import { ShopToolbar } from "./shop-toolbar";
import type { CategoryItem } from "@/lib/shop/query-categories";

interface Props {
  total: number;
  categories: CategoryItem[];
  className?: string;
}

export function ShopToolbarWithFilters({ total, categories, className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ShopToolbar total={total} className={className} onMobileFilter={() => setOpen(true)} />

      {/* Mobile filter drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Drawer panel */}
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
              <span className="text-sm font-bold text-foreground">Filters</span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FiltersSidebar categories={categories} />
            </div>
            {/* Close strip at bottom */}
            <div className="shrink-0 border-t border-border p-4">
              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-xl bg-foreground py-3 text-sm font-bold text-background"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
