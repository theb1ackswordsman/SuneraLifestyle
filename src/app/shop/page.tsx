import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { FiltersSidebar } from "@/components/shop/filters-sidebar";
import { ShopToolbar } from "@/components/shop/shop-toolbar";
import { Pagination } from "@/components/shop/pagination";
import { ProductCard } from "@/components/shared/product-card";
import { queryProducts, type SortOption, type BadgeFilter } from "@/lib/shop/query-products";
import { queryCategories } from "@/lib/shop/query-categories";
import { fallbackProducts, fallbackCategories } from "@/lib/shop/fallback";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shop — SunEra Lifestyle",
  description: "Browse premium health supplements and fitness clothing. Filter by category, price, and more.",
};

// Category slug → fallback gradient for product cards without images
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

function getBadge(p: {
  isBestSeller: boolean;
  isNewArrival: boolean;
  compareAtPrice?: number;
  basePrice: number;
}): "bestseller" | "new" | "sale" | undefined {
  if (p.isBestSeller) return "bestseller";
  if (p.compareAtPrice && p.compareAtPrice > p.basePrice) return "sale";
  if (p.isNewArrival) return "new";
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

  const category = str(sp.category);
  const sort     = str(sp.sort) as SortOption | undefined;
  const badge    = str(sp.badge) as BadgeFilter | undefined;
  const search   = str(sp.q);
  const page     = parseInt(str(sp.page) ?? "1") || 1;
  const minPrice = sp.minPrice ? parseInt(str(sp.minPrice)!) || undefined : undefined;
  const maxPrice = sp.maxPrice ? parseInt(str(sp.maxPrice)!) || undefined : undefined;

  const queryArgs = { category, sort, badge, search, page, minPrice, maxPrice };
  let productResult: Awaited<ReturnType<typeof queryProducts>>;
  let categories: Awaited<ReturnType<typeof queryCategories>>;
  try {
    [productResult, categories] = await Promise.all([
      queryProducts(queryArgs),
      queryCategories(),
    ]);
  } catch {
    // DB unavailable — render the storefront with mock data so the UI still works
    productResult = fallbackProducts(queryArgs);
    categories = fallbackCategories();
  }

  const { products, total, totalPages, page: currentPage } = productResult;

  const categoryLabel = category
    ? categories.find((c) => c.slug === category)?.name ?? category
    : "All Products";

  return (
    <ShopLayout>
      {/* Page header */}
      <div className="bg-linear-to-br from-[#071f04] via-[#103a0c] to-[#1a5c14] pb-10 pt-24 lg:pt-28">
        <div className="container-padded">
          <nav className="mb-4 flex items-center gap-2 text-xs text-white/50">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">Shop</span>
            {category && (
              <>
                <span>/</span>
                <span className="text-white/80">{categoryLabel}</span>
              </>
            )}
          </nav>
          <h1 className="text-3xl font-black text-white sm:text-4xl">
            {search ? `Results for "${search}"` : categoryLabel}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {total > 0 ? `${total} products` : "No products found"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container-padded py-10">
        <div className="flex gap-8 lg:gap-10">
          {/* Sidebar — desktop */}
          <Suspense>
            <div className="hidden lg:block w-60 xl:w-64 shrink-0">
              <div className="sticky top-24">
                <FiltersSidebar categories={categories} />
              </div>
            </div>
          </Suspense>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <Suspense>
              <ShopToolbar total={total} className="mb-6" />
            </Suspense>

            {/* Grid */}
            {products.length === 0 ? (
              <EmptyState hasFilters={!!(category || badge || minPrice || maxPrice || search)} />
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
                      gradient={CAT_GRADIENTS[product.category?.slug ?? ""] ?? CAT_GRADIENTS.protein}
                    />
                  ))}
                </div>

                {/* Pagination */}
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
          : "We haven't added products here yet. Check back soon!"}
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

