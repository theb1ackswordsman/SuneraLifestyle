"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/shared/product-card";
import type { FeaturedSection } from "@/lib/shop/query-featured-by-type";

const CAT_GRADIENTS: Record<string, string> = {
  immunity:             "from-[#1a5c14] to-[#071f04]",
  "digestive-care":     "from-amber-600 to-orange-800",
  "weight-management":  "from-emerald-600 to-teal-900",
  "womens-care":        "from-rose-500 to-pink-800",
  "mens-wellness":      "from-slate-700 to-gray-950",
  "ayurvedic-medicine": "from-[#1a5c14] to-[#0a2e06]",
  detox:                "from-emerald-700 to-emerald-950",
  kurtis:               "from-fuchsia-600 to-purple-900",
  suits:                "from-rose-700 to-red-950",
};

function getBadge(p: { isBestSeller: boolean; isNewArrival: boolean; compareAtPrice?: number; basePrice: number }) {
  if (p.isBestSeller) return "bestseller" as const;
  if (p.compareAtPrice && p.compareAtPrice > p.basePrice) return "sale" as const;
  if (p.isNewArrival) return "new" as const;
  return undefined;
}

function CategorySection({ section }: { section: FeaturedSection }) {
  const scrollRef                 = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]    = useState(false);
  const [canRight, setCanRight]   = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, section.products]);

  function scrollBy(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("div")?.offsetWidth ?? 220;
    el.scrollBy({ left: dir === "left" ? -(cardWidth + 16) * 2 : (cardWidth + 16) * 2, behavior: "smooth" });
  }

  const hasSlider = section.products.length > 5;

  return (
    <div>
      {/* Section header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground sm:text-2xl">{section.name}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Featured picks just for you</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Arrows — only if slider needed */}
          {hasSlider && (
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => scrollBy("left")}
                disabled={!canLeft}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground/70 transition-colors hover:bg-muted disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollBy("right")}
                disabled={!canRight}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground/70 transition-colors hover:bg-muted disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          <Link
            href={`/shop?type=${section.slug}`}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-emerald transition-all hover:gap-2.5"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {section.products.map((product) => (
          <div
            key={product._id}
            className="w-[calc(50%-8px)] shrink-0 sm:w-[calc(33.33%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)]"
            style={{ scrollSnapAlign: "start" }}
          >
            <ProductCard
              id={product._id}
              name={product.name}
              slug={product.slug}
              price={product.basePrice}
              compareAtPrice={product.compareAtPrice}
              rating={product.reviewSummary.average}
              reviewCount={product.reviewSummary.count}
              badge={getBadge(product)}
              image={product.images[0]}
              stock={product.stock}
              gradient={CAT_GRADIENTS[product.category?.slug ?? ""] ?? "from-slate-600 to-slate-900"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryProductsSections({ sections }: { sections: FeaturedSection[] }) {
  if (sections.length === 0) return null;

  return (
    <div className="container-padded space-y-12 py-10">
      {sections.map((section) => (
        <CategorySection key={section._id} section={section} />
      ))}
    </div>
  );
}
