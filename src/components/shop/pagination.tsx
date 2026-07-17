"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();
  const [pending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  function goTo(p: number) {
    if (p < 1 || p > totalPages) return;
    const next = new URLSearchParams(params.toString());
    next.set("page", String(p));
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  // Build visible page numbers: always show first, last, current ±1, with ellipsis
  const pages: (number | "…")[] = [];
  const addPage = (n: number) => { if (!pages.includes(n)) pages.push(n); };

  addPage(1);
  if (page > 3) pages.push("…");
  if (page > 2) addPage(page - 1);
  addPage(page);
  if (page < totalPages - 1) addPage(page + 1);
  if (page < totalPages - 2) pages.push("…");
  addPage(totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1", pending && "opacity-50 pointer-events-none")}
    >
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-sm transition-colors hover:border-brand-emerald hover:text-brand-emerald disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p as number)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium transition-colors",
              p === page
                ? "border-brand-emerald bg-brand-emerald text-white"
                : "border-border hover:border-brand-emerald hover:text-brand-emerald"
            )}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-sm transition-colors hover:border-brand-emerald hover:text-brand-emerald disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
