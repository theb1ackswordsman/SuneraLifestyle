import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { connectDB } from "@/lib/db/connection";
import { Collection } from "@/models/collection.model";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Collections — ${siteConfig.name}`,
  description: "Explore curated collections of premium ethnic wear, ayurvedic wellness and handcrafted products.",
};

export default async function CollectionsPage() {
  await connectDB();
  const dbCollections = await Collection.find({ isActive: true })
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();

  const collections = dbCollections.map((c) => ({
    title: c.name,
    slug: c.slug,
    description: c.shortDescription || c.description || "",
    image: c.thumbnail || c.banner || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80",
    badge: c.badge,
    href: `/collections/${c.slug}`,
  }));

  return (
    <ShopLayout>
      {/* Header */}
      <div className="bg-linear-to-br from-[#071f04] via-[#103a0c] to-[#1a5c14] pb-12 pt-24 lg:pt-28">
        <div className="container-padded">
          <nav className="mb-4 flex items-center gap-2 text-xs text-white/50">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">Collections</span>
          </nav>
          <h1 className="text-3xl font-black text-white sm:text-4xl">Shop by Collection</h1>
          <p className="mt-2 max-w-lg text-sm text-white/60">
            Hand-picked edits to help you find exactly what you need — from ethnic wear to ayurvedic wellness.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="container-padded py-12">
        {collections.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <Link
                key={c.slug}
                href={c.href}
                className="group relative flex min-h-70 flex-col justify-end overflow-hidden rounded-2xl bg-gray-100 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image}
                  alt={c.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10" />
                <div className="relative z-10 p-6">
                  {c.badge && (
                    <span className="inline-block rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-white mb-2">
                      {c.badge}
                    </span>
                  )}
                  <h2 className="text-2xl font-black text-white">{c.title}</h2>
                  {c.description && <p className="mt-1.5 max-w-xs text-sm text-white/75 line-clamp-2">{c.description}</p>}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white transition-all group-hover:gap-3">
                    Shop Collection <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Layers className="h-12 w-12 text-gray-300 mb-3" />
            <h2 className="text-lg font-bold text-gray-800">No Collections Available</h2>
            <p className="text-sm text-gray-500 mt-1">Check back soon for new curated collections.</p>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
