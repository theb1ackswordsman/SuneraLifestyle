import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { ProductCard } from "@/components/shared/product-card";
import { connectDB } from "@/lib/db/connection";
import { Collection } from "@/models/collection.model";
import { Product } from "@/models/product.model";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawCollection {
  _id: unknown;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  thumbnail?: string;
  banner?: string;
  badge?: string;
  type: string;
  productAssignment: "manual" | "auto-tags" | "auto-category";
  manualProductIds?: unknown[];
  autoTags?: string[];
  autoCategorySlug?: string;
}

interface RawProduct {
  _id: unknown;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice?: number;
  images?: string[];
  stock?: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    await connectDB();
    const col = await Collection.findOne({ slug, isActive: true })
      .select("name shortDescription")
      .lean() as { name: string; shortDescription?: string } | null;
    if (!col) return { title: `Collections — ${siteConfig.name}` };
    return {
      title: `${col.name} — ${siteConfig.name}`,
      description: col.shortDescription ?? `Shop the ${col.name} collection at SunEra Lifestyle.`,
    };
  } catch {
    return { title: `Collections — ${siteConfig.name}` };
  }
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getCollectionWithProducts(slug: string) {
  await connectDB();

  const collection = await Collection.findOne({ slug, isActive: true }).lean() as RawCollection | null;
  if (!collection) return null;

  let productQuery: Record<string, unknown> = { isActive: true, deletedAt: null };

  if (collection.productAssignment === "manual" && collection.manualProductIds?.length) {
    productQuery._id = { $in: collection.manualProductIds };
  } else if (collection.productAssignment === "auto-tags" && collection.autoTags?.length) {
    productQuery.tags = { $in: collection.autoTags };
  } else if (collection.productAssignment === "auto-category" && collection.autoCategorySlug) {
    const { Category } = await import("@/models/category.model");
    const cat = await Category.findOne({ slug: collection.autoCategorySlug }).lean() as { _id: unknown } | null;
    if (cat) productQuery.category = cat._id;
  }

  const products = await Product.find(productQuery)
    .select("_id name slug basePrice compareAtPrice images stock isFeatured isBestSeller isNewArrival tags")
    .limit(48)
    .lean() as RawProduct[];

  return { collection, products };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let data: { collection: RawCollection; products: RawProduct[] } | null = null;
  try {
    data = await getCollectionWithProducts(slug);
  } catch {
    // fall through to notFound
  }
  if (!data) notFound();

  const { collection, products } = data;

  const typeLabel =
    collection.type === "ethnic-wear"
      ? "Ethnic Wear"
      : collection.type === "ayurvedic"
      ? "Ayurvedic"
      : "Collection";

  return (
    <ShopLayout>
      {/* Banner */}
      <div className="relative overflow-hidden min-h-48 sm:min-h-64 flex items-end bg-[#1a5c14]">
        {collection.banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={collection.banner}
            alt={collection.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : collection.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={collection.thumbnail}
            alt={collection.name}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : null}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
        <div className="relative z-10 container-padded pb-8 pt-20 sm:pb-12">
          <Link
            href="/collections"
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Collections
          </Link>
          {collection.badge && (
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f5a823] mb-2">
              {collection.badge}
            </p>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-white">{collection.name}</h1>
          {collection.shortDescription && (
            <p className="mt-2 text-sm text-white/70 max-w-lg">{collection.shortDescription}</p>
          )}
          <p className="mt-3 text-xs text-white/40">
            {typeLabel} &middot; {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Description */}
      {collection.description && (
        <div className="container-padded py-6 border-b border-gray-100">
          <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">{collection.description}</p>
        </div>
      )}

      {/* Products grid */}
      <div className="container-padded py-8 lg:py-12">
        {products.length > 0 ? (
          <>
            <p className="mb-6 text-xs text-gray-400 font-medium">
              Showing {products.length} product{products.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => {
                const id = String(p._id);
                const hasDiscount = p.compareAtPrice && p.compareAtPrice > p.basePrice;
                const badge = p.isNewArrival
                  ? "new"
                  : p.isBestSeller
                  ? "bestseller"
                  : hasDiscount
                  ? "sale"
                  : undefined;
                return (
                  <ProductCard
                    key={id}
                    id={id}
                    name={p.name}
                    slug={p.slug}
                    price={p.basePrice}
                    compareAtPrice={p.compareAtPrice}
                    image={p.images?.[0]}
                    badge={badge as "new" | "bestseller" | "sale" | undefined}
                    rating={0}
                    reviewCount={0}
                    stock={p.stock}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="text-3xl mb-4">🌿</p>
            <h2 className="text-lg font-black text-gray-800">No Products Yet</h2>
            <p className="mt-2 text-sm text-gray-500">
              Products will appear here once added to this collection.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1a5c14] px-6 py-3 text-sm font-bold text-white hover:bg-[#103a0c] transition-colors"
            >
              Browse All Products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Back CTA */}
      {products.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 py-8">
          <div className="container-padded flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-bold text-gray-800">Explore More Collections</p>
              <p className="text-xs text-gray-500">Discover other curated picks for you</p>
            </div>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 rounded-full bg-[#1a5c14] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#103a0c] transition-all hover:gap-3"
            >
              View All Collections <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </ShopLayout>
  );
}
