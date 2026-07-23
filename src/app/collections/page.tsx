import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { COLLECTIONS } from "@/data/mock/content";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Collections — ${siteConfig.name}`,
  description: "Explore curated collections of premium supplements, activewear and fitness gear.",
};

export default function CollectionsPage() {
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
            Hand-picked edits to help you find exactly what your training needs — from best sellers to the latest drops.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="container-padded py-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((c) => (
            <Link
              key={c.slug}
              href={c.href}
              className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt={c.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10" />
              <div className="relative z-10 p-6">
                <h2 className="text-2xl font-black text-white">{c.title}</h2>
                <p className="mt-1.5 max-w-xs text-sm text-white/75">{c.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white transition-all group-hover:gap-3">
                  Shop Collection <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ShopLayout>
  );
}
