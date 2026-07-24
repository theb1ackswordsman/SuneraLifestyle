import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { connectDB } from "@/lib/db/connection";
import { Collection } from "@/models/collection.model";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Collections — ${siteConfig.name}`,
  description: "Explore curated collections of premium Ayurvedic wellness products and timeless ethnic fashion.",
};

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Data fetching (server-side)
// ---------------------------------------------------------------------------

interface CollectionItem {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  thumbnail: string;
  banner: string;
  badge: string;
  type: "ethnic-wear" | "ayurvedic" | "mixed";
  displayOrder: number;
  isFeatured: boolean;
}

async function getCollections(): Promise<CollectionItem[]> {
  try {
    await connectDB();
    const data = await Collection.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .select("name slug shortDescription thumbnail banner badge type displayOrder isFeatured")
      .lean();
    return data.map((c) => ({
      _id:             String((c as { _id: unknown })._id),
      name:            c.name,
      slug:            c.slug,
      shortDescription: c.shortDescription,
      thumbnail:       c.thumbnail,
      banner:          c.banner,
      badge:           c.badge,
      type:            c.type,
      displayOrder:    c.displayOrder,
      isFeatured:      c.isFeatured,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

function FeaturedCard({ c }: { c: CollectionItem }) {
  return (
    <Link
      href={`/collections/${c.slug}`}
      className="group relative flex min-h-64 flex-col justify-end overflow-hidden rounded-2xl bg-gray-100"
    >
      {c.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.thumbnail}
          alt={c.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-[#1a5c14] to-[#071f04]" />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
      <div className="relative z-10 p-5">
        {c.badge && (
          <p className="mb-1.5 text-xs font-semibold text-white/70">{c.badge}</p>
        )}
        <h3 className="text-xl font-black text-white leading-tight">{c.name}</h3>
        {c.shortDescription && (
          <p className="mt-1 text-sm text-white/70 line-clamp-2">{c.shortDescription}</p>
        )}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white transition-all group-hover:gap-3">
          Shop Now <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function CollectionRow({ c }: { c: CollectionItem }) {
  return (
    <Link
      href={`/collections/${c.slug}`}
      className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 transition-all hover:border-[#1a5c14]/30 hover:bg-[#1a5c14]/5 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        {c.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.thumbnail}
            alt={c.name}
            className="h-10 w-10 rounded-lg object-cover shrink-0"
          />
        )}
        <div>
          <p className="text-sm font-bold text-gray-900 group-hover:text-[#1a5c14] transition-colors">
            {c.name}
          </p>
          {c.badge && <p className="text-xs text-gray-400">{c.badge}</p>}
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#1a5c14] group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CollectionsPage() {
  const all = await getCollections();

  const featured  = all.filter((c) => c.isFeatured);
  const ethnic    = all.filter((c) => c.type === "ethnic-wear");
  const ayurvedic = all.filter((c) => c.type === "ayurvedic");
  const mixed     = all.filter((c) => c.type === "mixed");

  const hasContent = all.length > 0;

  return (
    <ShopLayout>
      {/* ── 1. HERO BANNER ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-linear-to-br from-[#071f04] via-[#103a0c] to-[#1a5c14]">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 70% 50%, #f5a823 0%, transparent 60%),
                              radial-gradient(circle at 20% 80%, #4ade80 0%, transparent 50%)`,
          }}
        />
        <div className="container-padded relative py-20 lg:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50 mb-3">
            Curated For You
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight max-w-2xl">
            Discover Curated<br />Collections
          </h1>
          <p className="mt-4 text-base text-white/60 max-w-lg">
            Timeless Ethnic Fashion &amp; Authentic Ayurvedic Wellness — hand-picked for your lifestyle.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop?type=clothes"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#1a5c14] transition-all hover:bg-white/90 hover:gap-3"
            >
              Shop Ethnic Wear <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/shop?type=ayurvedic-products"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:gap-3"
            >
              Shop Supplements <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {hasContent ? (
        <>
          {/* ── 2. FEATURED COLLECTIONS ───────────────────────────────────── */}
          {featured.length > 0 && (
            <section className="container-padded py-12 lg:py-16">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#1a5c14]">Highlighted</p>
                  <h2 className="mt-1 text-2xl font-black text-gray-900">Featured Collections</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.slice(0, 6).map((c) => (
                  <FeaturedCard key={c._id} c={c} />
                ))}
              </div>
            </section>
          )}

          {/* ── 3. SHOP BY COLLECTION ─────────────────────────────────────── */}
          {(ethnic.length > 0 || ayurvedic.length > 0 || mixed.length > 0) && (
            <section className="bg-gray-50 py-12 lg:py-16">
              <div className="container-padded">
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#1a5c14]">Browse</p>
                  <h2 className="mt-1 text-2xl font-black text-gray-900">Shop by Collection</h2>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  {/* Ethnic Wear */}
                  {ethnic.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-xl">👗</span>
                        <h3 className="text-base font-black text-gray-800">Ethnic Wear</h3>
                        <Link href="/shop?type=clothes" className="ml-auto text-xs font-semibold text-[#1a5c14] hover:underline">
                          View all
                        </Link>
                      </div>
                      <div className="space-y-2">
                        {ethnic.map((c) => <CollectionRow key={c._id} c={c} />)}
                      </div>
                    </div>
                  )}

                  {/* Ayurvedic */}
                  {ayurvedic.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-xl">🌿</span>
                        <h3 className="text-base font-black text-gray-800">Ayurvedic Collections</h3>
                        <Link href="/shop?type=ayurvedic-products" className="ml-auto text-xs font-semibold text-[#1a5c14] hover:underline">
                          View all
                        </Link>
                      </div>
                      <div className="space-y-2">
                        {ayurvedic.map((c) => <CollectionRow key={c._id} c={c} />)}
                      </div>
                    </div>
                  )}

                  {/* Mixed */}
                  {mixed.length > 0 && (
                    <div className={ethnic.length > 0 && ayurvedic.length > 0 ? "lg:col-span-2" : ""}>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-xl">✨</span>
                        <h3 className="text-base font-black text-gray-800">Special Collections</h3>
                      </div>
                      <div className={`grid gap-2 ${ethnic.length > 0 && ayurvedic.length > 0 ? "sm:grid-cols-2" : ""}`}>
                        {mixed.map((c) => <CollectionRow key={c._id} c={c} />)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ── 4. SEASONAL BANNER ────────────────────────────────────────── */}
          {all.length > 0 && (() => {
            const pick = all.find((c) => c.banner) ?? null;
            if (!pick) return null;
            return (
              <section className="container-padded py-12">
                <Link
                  href={`/collections/${pick.slug}`}
                  className="group relative flex min-h-48 sm:min-h-64 items-center overflow-hidden rounded-2xl"
                >
                  {pick.banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pick.banner}
                      alt={pick.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-r from-[#1a5c14] to-[#103a0c]" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-r from-black/70 to-black/20" />
                  <div className="relative z-10 max-w-lg p-8 sm:p-12">
                    {pick.badge && <p className="text-xs font-semibold uppercase tracking-widest text-[#f5a823] mb-2">{pick.badge}</p>}
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">{pick.name}</h2>
                    {pick.shortDescription && (
                      <p className="mt-2 text-sm text-white/70">{pick.shortDescription}</p>
                    )}
                    <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-gray-900 transition-all group-hover:gap-3">
                      Explore Collection <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </section>
            );
          })()}
        </>
      ) : (
        /* Empty state */
        <div className="container-padded py-20 text-center">
          <p className="text-4xl mb-4">🌿</p>
          <h2 className="text-xl font-black text-gray-800">Collections Coming Soon</h2>
          <p className="mt-2 text-sm text-gray-500">We&apos;re curating special collections for you. Check back soon!</p>
          <Link href="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1a5c14] px-6 py-3 text-sm font-bold text-white hover:bg-[#103a0c]">
            Browse All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* ── 5. WHY CHOOSE SUNERA ──────────────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-white py-12 lg:py-16">
        <div className="container-padded">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1a5c14]">Our Promise</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">Why Choose SunEra</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 max-w-3xl mx-auto">
            {/* Ethnic Wear */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50">
                <span className="text-2xl">👗</span>
              </div>
              <h3 className="text-base font-black text-gray-900 mb-3">Ethnic Wear</h3>
              <ul className="space-y-2">
                {["Premium Natural Fabrics", "Comfortable & Breathable Fit", "Elegant Handcrafted Designs", "Sizes for Every Body"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-[#1a5c14] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ayurvedic */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                <span className="text-2xl">🌿</span>
              </div>
              <h3 className="text-base font-black text-gray-900 mb-3">Ayurvedic Supplements</h3>
              <ul className="space-y-2">
                {["100% Ayurvedic Ingredients", "GMP Certified Manufacturing", "Lab Tested & Quality Verified", "No Harmful Additives"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-[#1a5c14] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. CTA BANNER ─────────────────────────────────────────────────── */}
      <section className="bg-linear-to-r from-[#071f04] to-[#1a5c14] py-14">
        <div className="container-padded text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Not Sure What to Choose?</h2>
          <p className="mt-3 text-white/60 text-sm max-w-md mx-auto">
            Explore our complete range of Ayurvedic products and ethnic wear — something for everyone.
          </p>
          <Link
            href="/shop"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#1a5c14] transition-all hover:bg-white/90 hover:gap-3"
          >
            Shop All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </ShopLayout>
  );
}
