import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Sparkles, ShieldCheck, Truck, RotateCcw,
  CheckCircle2, Layers, Package, Tag, Leaf
} from "lucide-react";
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

  const productQuery: Record<string, unknown> = { isActive: true, deletedAt: null };

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
// Page Component
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
      ? "Ayurvedic Care"
      : "Curated Edit";

  const heroImage = collection.banner || collection.thumbnail || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1600&q=85";

  return (
    <ShopLayout>
      {/* ------------------------------------------------------------------ */}
      {/* 1. Hero Section                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative overflow-hidden min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] flex items-end bg-gray-950">
        {/* Hero Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt={collection.name}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Clean neutral dark gradient overlay without any green tint */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* Content Box */}
        <div className="relative z-10 container-padded pb-12 pt-32 sm:pb-16 sm:pt-40 w-full">
          {/* Top Breadcrumb & Badge Row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-white/90 border border-white/20 transition-all hover:scale-105"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All Collections
            </Link>

            {collection.badge && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5a823] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-gray-950 shadow-md">
                <Sparkles className="h-3 w-3 fill-gray-950" />
                {collection.badge}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            {collection.name}
          </h1>

          {/* Short Description */}
          {collection.shortDescription && (
            <p className="mt-3 text-base sm:text-lg text-white/90 max-w-2xl font-light leading-relaxed drop-shadow">
              {collection.shortDescription}
            </p>
          )}

          {/* Quick Stat Badges */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white border border-white/10">
              <Package className="h-4 w-4 text-[#f5a823]" />
              <span>{products.length} Products Available</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white border border-white/10">
              <Leaf className="h-4 w-4 text-emerald-400" />
              <span>{typeLabel}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white border border-white/10">
              <Truck className="h-4 w-4 text-amber-300" />
              <span>Express Delivery Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Collection Story / Full Description                             */}
      {/* ------------------------------------------------------------------ */}
      {collection.description && (
        <div className="bg-emerald-950/5 border-b border-emerald-900/10 py-8">
          <div className="container-padded">
            <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1a5c14] mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                Collection Edit
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
                {collection.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. Trust & Assurance Bar                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-b border-gray-100 bg-gray-50/80 py-5">
        <div className="container-padded">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl bg-white p-3.5 border border-gray-100 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#1a5c14]">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Free Express Shipping</p>
                <p className="text-[11px] text-gray-500">On all orders above ₹999</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-white p-3.5 border border-gray-100 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">100% Authentic Quality</p>
                <p className="text-[11px] text-gray-500">Directly from SunEra Lifestyle</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-white p-3.5 border border-gray-100 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Easy 7-Day Returns</p>
                <p className="text-[11px] text-gray-500">Hassle-free replacement policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Product Showcase Grid                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="container-padded py-10 lg:py-16 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">Featured Items</h2>
              <span className="rounded-full bg-[#1a5c14] px-2.5 py-0.5 text-xs font-bold text-white">
                {products.length}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Explore handpicked items curated for {collection.name}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#1a5c14]" />
              In Stock & Ready to Ship
            </span>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
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
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-20 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100/60 text-[#1a5c14]">
              <Layers className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">No Products in Collection Yet</h2>
              <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                Items will appear here as soon as they are assigned to this collection in the admin dashboard.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1a5c14] px-6 py-3 text-sm font-bold text-white hover:bg-[#103a0c] transition-all hover:gap-3"
            >
              Browse All Products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. Bottom Call-To-Action Banner                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-t border-gray-100 bg-gradient-to-r from-[#071f04] via-[#103a0c] to-[#1a5c14] py-12 text-white">
        <div className="container-padded flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-[#f5a823]">Explore More</span>
            <h3 className="text-xl sm:text-2xl font-black">Discover All Curated Collections</h3>
            <p className="text-xs sm:text-sm text-white/70">Find clothing, wellness products, and handcrafted items tailored for you.</p>
          </div>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-gray-900 hover:bg-gray-100 transition-all hover:scale-105 shrink-0 shadow-lg"
          >
            View All Collections <ArrowRight className="h-4 w-4 text-[#1a5c14]" />
          </Link>
        </div>
      </div>
    </ShopLayout>
  );
}
