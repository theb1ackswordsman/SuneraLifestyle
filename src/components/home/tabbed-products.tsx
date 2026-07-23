"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/shared/product-card";
import type { TabbedProductSets, TabbedProduct } from "@/lib/shop/query-tabbed-products";

type Tab = "new" | "bestseller" | "rating";

const TABS: { id: Tab; label: string }[] = [
  { id: "new",        label: "New Arrival"  },
  { id: "bestseller", label: "Best Selling" },
  { id: "rating",     label: "Top Rated"   },
];

function getBadge(p: TabbedProduct): "new" | "sale" | "bestseller" | undefined {
  if (p.isBestSeller) return "bestseller";
  if (p.compareAtPrice && p.compareAtPrice > p.basePrice) return "sale";
  if (p.isNewArrival) return "new";
  return undefined;
}

function EmptyTab() {
  return (
    <div className="col-span-full flex flex-col items-center gap-3 py-16 text-muted-foreground">
      <ShoppingBag className="h-10 w-10 opacity-20" />
      <p className="text-sm">No products here yet — add some from the admin panel.</p>
    </div>
  );
}

interface Props { sets: TabbedProductSets }

export function TabbedProducts({ sets }: Props) {
  const [active, setActive] = useState<Tab>("new");

  const productsByTab: Record<Tab, TabbedProduct[]> = {
    new:        sets.newArrivals,
    bestseller: sets.bestSellers,
    rating:     sets.topRated,
  };

  const products = productsByTab[active];

  return (
    <section id="new-arrivals" className="container-padded py-10">
      {/* Heading */}
      <div className="mb-7 text-center">
        <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Featured Products
        </h2>

        {/* Tabs */}
        <div className="mt-4 flex items-center justify-center gap-0">
          {TABS.map((tab, i) => (
            <div key={tab.id} className="flex items-center">
              {i > 0 && <span className="mx-4 h-4 w-px bg-border" />}
              <button
                onClick={() => setActive(tab.id)}
                className={cn(
                  "relative pb-1 text-sm font-semibold transition-colors",
                  active === tab.id
                    ? "text-brand-emerald"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {active === tab.id && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-emerald"
                  />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {products.length === 0 ? (
            <EmptyTab />
          ) : (
            products.slice(0, 5).map((p) => (
              <ProductCard
                key={p._id}
                id={p._id}
                name={p.name}
                slug={p.slug}
                price={p.basePrice}
                compareAtPrice={p.compareAtPrice}
                rating={p.reviewSummary.average}
                reviewCount={p.reviewSummary.count}
                badge={getBadge(p)}
                image={p.images[0]}
                stock={p.stock}
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* View all */}
      <div className="mt-8 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-emerald hover:underline"
        >
          View All Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
