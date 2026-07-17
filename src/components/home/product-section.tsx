"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/shared/product-card";
import { MOCK_PRODUCTS } from "@/data/mock/homepage";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  filter?: "new" | "bestseller" | "sale";
  limit?: number;
}

export function ProductSection({
  title,
  subtitle,
  viewAllHref = "/shop",
  filter,
  limit = 8,
}: ProductSectionProps) {
  const products = filter
    ? MOCK_PRODUCTS.filter((p) => p.badge === filter).slice(0, limit)
    : MOCK_PRODUCTS.slice(0, limit);

  const displayProducts = products.length > 0 ? products : MOCK_PRODUCTS.slice(0, limit);

  return (
    <section className="section-padding container-padded">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          {subtitle && (
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-emerald">
              {subtitle}
            </p>
          )}
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h2>
        </div>
        <Link
          href={viewAllHref}
          className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand-emerald transition-colors group"
        >
          View All
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {displayProducts.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>

      {/* Mobile View All */}
      <div className="mt-8 flex sm:hidden justify-center">
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-semibold transition-colors hover:border-brand-emerald hover:text-brand-emerald"
        >
          View All {title} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
