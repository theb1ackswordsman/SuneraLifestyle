"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MOCK_PRODUCTS } from "@/data/mock/homepage";
import { ProductCard } from "@/components/shared/product-card";
import { ArrowRight } from "lucide-react";

type Tab = "new" | "bestseller" | "rating";

const TABS: { id: Tab; label: string }[] = [
  { id: "new",        label: "New Arrival"  },
  { id: "bestseller", label: "Best Selling" },
  { id: "rating",     label: "Top Rated"   },
];

function getProducts(tab: Tab) {
  switch (tab) {
    case "new":
      return [...MOCK_PRODUCTS].sort((a, b) => (b.badge === "new" ? 1 : 0) - (a.badge === "new" ? 1 : 0));
    case "bestseller":
      return [...MOCK_PRODUCTS].sort((a, b) => (b.badge === "bestseller" ? 1 : 0) - (a.badge === "bestseller" ? 1 : 0));
    case "rating":
      return [...MOCK_PRODUCTS].sort((a, b) => b.rating - a.rating);
  }
}

export function TabbedProducts() {
  const [active, setActive] = useState<Tab>("new");
  const products = getProducts(active);

  return (
    <section className="container-padded py-10">
      {/* Heading */}
      <div className="mb-7 text-center">
        <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
          Featured Products
        </h2>

        {/* Tabs */}
        <div className="mt-4 flex items-center justify-center gap-0">
          {TABS.map((tab, i) => (
            <div key={tab.id} className="flex items-center">
              {i > 0 && <span className="h-4 w-px bg-gray-300 mx-4" />}
              <button
                onClick={() => setActive(tab.id)}
                className={cn(
                  "relative pb-1 text-sm font-semibold transition-colors",
                  active === tab.id ? "text-brand-emerald" : "text-gray-500 hover:text-gray-700"
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

      {/* Product Grid */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        {products.slice(0, 5).map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            slug={product.slug}
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            rating={product.rating}
            reviewCount={product.reviewCount}
            badge={product.badge}
            image={product.image}
            gradient={product.gradient}
          />
        ))}
      </motion.div>

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
