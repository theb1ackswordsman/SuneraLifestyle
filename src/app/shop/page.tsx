import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ShopLayout } from "@/components/layout/shop-layout";
import { FiltersSidebar } from "@/components/shop/filters-sidebar";
import { ShopToolbarWithFilters } from "@/components/shop/mobile-filters";
import { Pagination } from "@/components/shop/pagination";
import { ProductCard } from "@/components/shared/product-card";
import { queryProducts, type SortOption, type BadgeFilter } from "@/lib/shop/query-products";
import { queryCategories } from "@/lib/shop/query-categories";
import { fallbackProducts, fallbackCategories } from "@/lib/shop/fallback";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Shop — SunEra Lifestyle",
  description: "Browse premium Ayurvedic products and ethnic wear. Filter by category, price, and more.",
};

const CAT_GRADIENTS: Record<string, string> = {
  detox:                "from-emerald-700 to-emerald-950",
  immunity:             "from-[#1a5c14] to-[#071f04]",
  "weight-management":  "from-emerald-600 to-teal-900",
  "digestive-care":     "from-amber-600 to-orange-800",
  "womens-care":        "from-rose-500 to-pink-800",
  "mens-wellness":      "from-slate-700 to-gray-950",
  "ayurvedic-medicine": "from-[#1a5c14] to-[#0a2e06]",
  kurtis:               "from-fuchsia-600 to-purple-900",
  suits:                "from-rose-700 to-red-950",
};

function getBadge(p: { isBestSeller: boolean; isNewArrival: boolean; compareAtPrice?: number; basePrice: number }) {
  if (p.isBestSeller) return "bestseller" as const;
  if (p.compareAtPrice && p.compareAtPrice > p.basePrice) return "sale" as const;
  if (p.isNewArrival) return "new" as const;
  return undefined;
}

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const sp = await searchParams;

  const type     = str(sp.type);       // top-level category slug
  const category = str(sp.category);   // subcategory slug
  const size     = str(sp.size);       // variant size (clothing)
  const sort     = str(sp.sort) as SortOption | undefined;
  const badge    = str(sp.badge) as BadgeFilter | undefined;
  const search   = str(sp.q);
  const page     = parseInt(str(sp.page) ?? "1") || 1;
  const minPrice = sp.minPrice ? parseInt(str(sp.minPrice)!) || undefined : undefined;
  const maxPrice = sp.maxPrice ? parseInt(str(sp.maxPrice)!) || undefined : undefined;

  let categories: Awaited<ReturnType<typeof queryCategories>>;
  try {
    categories = await queryCategories();
  } catch {
    categories = fallbackCategories();
  }

  // If top-level type is selected (no specific subcategory), collect all subcategory slugs
  let categorySlugs: string[] | undefined;
  if (type && !category) {
    const parent = categories.find((c) => c.slug === type);
    if (parent) {
      categorySlugs = parent.subcategories.map((s) => s.slug);
    }
  }

  const queryArgs = { category, categorySlugs, size, sort, badge, search, page, minPrice, maxPrice };
  let productResult: Awaited<ReturnType<typeof queryProducts>>;
  try {
    productResult = await queryProducts(queryArgs);
  } catch {
    productResult = fallbackProducts(queryArgs);
  }

  const { products, total, totalPages, page: currentPage } = productResult;

  const activeParent = type ? categories.find((c) => c.slug === type) : null;
  const activeSub    = category
    ? categories.flatMap((c) => c.subcategories).find((s) => s.slug === category)
    : null;

  return (
    <ShopLayout>
      <div className="container-padded pt-24 lg:pt-28">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          {activeParent && (
            <>
              <span>/</span>
              <Link href={`/shop?type=${activeParent.slug}`} className="hover:text-foreground transition-colors">
                {activeParent.name}
              </Link>
            </>
          )}
          {activeSub && (
            <>
              <span>/</span>
              <span className="text-foreground">{activeSub.name}</span>
            </>
          )}
          {!activeParent && !activeSub && !search && (
            <>
              <span>/</span>
              <span className="text-foreground">All Products</span>
            </>
          )}
        </nav>

        <div className="mb-6 border-b border-border" />

        {/* Layout */}
        <div className="flex gap-8 lg:gap-10 pb-16">
          {/* Sidebar */}
          <Suspense>
            <div className="hidden lg:block w-56 xl:w-60 shrink-0">
              <div className="sticky top-24">
                <FiltersSidebar categories={categories} />
              </div>
            </div>
          </Suspense>

          {/* Main */}
          <div className="flex-1 min-w-0">
            <Suspense>
              <ShopToolbarWithFilters total={total} categories={categories} className="mb-5" />
            </Suspense>

            {products.length === 0 ? (
              <EmptyState hasFilters={!!(type || category || badge || minPrice || maxPrice || search)} />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      id={product._id}
                      name={product.name}
                      slug={product.slug}
                      price={product.basePrice}
                      compareAtPrice={product.compareAtPrice}
                      rating={product.reviewSummary.average}
                      reviewCount={product.reviewSummary.count}
                      badge={getBadge(product)}
                      image={product.images[0]}
                      gradient={CAT_GRADIENTS[product.category?.slug ?? ""] ?? "from-slate-600 to-slate-900"}
                    />
                  ))}
                </div>
                <Suspense>
                  <div className="mt-12">
                    <Pagination page={currentPage} totalPages={totalPages} />
                  </div>
                </Suspense>
              </>
            )}
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <ShoppingBag className="h-9 w-9 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold">No products found</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        {hasFilters
          ? "Try adjusting your filters or clearing them to see more products."
          : "Products haven't been added yet. Check back soon!"}
      </p>
      {hasFilters && (
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-emerald px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-emerald-dark transition-colors"
        >
          Clear all filters
        </Link>
      )}
    </div>
  );
}
