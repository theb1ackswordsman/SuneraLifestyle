"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Star, Heart, ShoppingBag, Check, Truck, RefreshCw, ShieldCheck,
  Minus, Plus, ChevronRight,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/shared/product-card";
import type { ProductDetail, RelatedProduct } from "@/lib/shop/query-product";
import { useRequireAuth } from "@/hooks/use-auth";

const MOCK_REVIEWS = [
  { name: "Aditya R.", rating: 5, date: "2 weeks ago", title: "Genuinely the best I've tried", body: "Mixes clean with zero clumps and the flavour isn't overpowering. Recovery has noticeably improved.", verified: true },
  { name: "Kavya S.", rating: 5, date: "1 month ago", title: "Worth every rupee", body: "Fast delivery, sealed packaging, and results within a few weeks. Will repurchase.", verified: true },
  { name: "Manish T.", rating: 4, date: "1 month ago", title: "Great value", body: "Does exactly what it says. Only wish there were more flavour options.", verified: true },
];

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i <= Math.round(rating)
              ? "fill-brand-orange text-brand-orange"
              : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  );
}

const TABS = ["Description", "Highlights", "Reviews"] as const;

function deriveBadge(p: ProductDetail | RelatedProduct): "new" | "sale" | "bestseller" | undefined {
  if (p.isBestSeller) return "bestseller";
  if (p.isNewArrival) return "new";
  return undefined;
}

export function ProductView({ product, related }: { product: ProductDetail; related: RelatedProduct[] }) {
  const gallery = product.images.length ? product.images : [];
  const sizes = product.variants
    .filter((v) => v.size && v.stock > 0)
    .map((v) => v.size as string)
    .filter((s, i, arr) => arr.indexOf(s) === i); // dedupe

  const badge = deriveBadge(product);
  const rating = product.reviewSummary.average;
  const reviewCount = product.reviewSummary.count;

  const router = useRouter();
  const { requireAuth } = useRequireAuth();

  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState(sizes[0] ?? "");
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Description");

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.basePrice
      ? Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)
      : null;

  function addToCart() {
    requireAuth(() => {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    });
  }

  function handleWishlist() {
    requireAuth(() => setWishlisted((w) => !w));
  }

  function handleBuyNow() {
    requireAuth(() => router.push("/checkout"));
  }

  return (
    <div className="pt-20 lg:pt-24">
      <div className="container-padded py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        {/* Main */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Gallery */}
          <div className="flex flex-col gap-4">
            <motion.div
              key={activeImg}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              className="relative aspect-square overflow-hidden rounded-2xl bg-muted"
            >
              {gallery[activeImg] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gallery[activeImg]} alt={product.name} className="h-full w-full object-cover" />
              )}
              {badge && (
                <div className="absolute left-4 top-4">
                  <Badge variant={badge === "sale" ? "sale" : badge === "new" ? "new" : "bestseller"}>
                    {badge === "new" ? "New" : badge === "bestseller" ? "Bestseller" : "Sale"}
                  </Badge>
                </div>
              )}
            </motion.div>

            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {gallery.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-xl bg-muted ring-2 transition-all",
                      i === activeImg ? "ring-brand-emerald" : "ring-transparent hover:ring-border"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`${product.name} view ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-emerald">
              {product.category.name}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{product.name}</h1>

            {/* Rating */}
            <div className="mt-3 flex items-center gap-2">
              <Stars rating={rating} />
              <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({reviewCount.toLocaleString()} reviews)</span>
            </div>

            {/* Price */}
            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-black">{formatPrice(product.basePrice)}</span>
              {product.compareAtPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
              {discount && (
                <span className="rounded-full bg-brand-orange/15 px-2.5 py-1 text-xs font-bold text-brand-orange-dark">
                  Save {discount}%
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            {/* Benefits preview */}
            {product.benefits.length > 0 && (
              <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {product.benefits.slice(0, 4).map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-emerald" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Size selector */}
            {sizes.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-semibold">Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={cn(
                        "min-w-11 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                        size === s
                          ? "border-brand-emerald bg-brand-emerald/10 text-brand-emerald-dark"
                          : "border-border hover:border-foreground/30"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-border">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-11 w-11 items-center justify-center rounded-l-xl transition-colors hover:bg-muted"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="flex h-11 w-11 items-center justify-center rounded-r-xl transition-colors hover:bg-muted"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button variant="primary" size="lg" onClick={addToCart} className="flex-1 min-w-45">
                {added ? (
                  <><Check className="h-4 w-4" /> Added to Cart</>
                ) : (
                  <><ShoppingBag className="h-4 w-4" /> Add to Cart</>
                )}
              </Button>

              <Button
                variant="outline"
                size="icon-lg"
                onClick={handleWishlist}
                aria-label="Add to wishlist"
                className="h-12 w-12 shrink-0"
              >
                <Heart className={cn("h-5 w-5", wishlisted && "fill-rose-500 text-rose-500")} />
              </Button>
            </div>

            <Button variant="default" size="lg" className="mt-3 w-full" onClick={handleBuyNow}>
              Buy It Now
            </Button>

            {/* Trust row */}
            <div className="mt-7 grid grid-cols-3 gap-3 border-t border-border pt-6">
              {[
                { icon: Truck, label: "Free delivery", sub: "Over ₹999" },
                { icon: RefreshCw, label: "7-day returns", sub: "Hassle-free" },
                { icon: ShieldCheck, label: "100% authentic", sub: "Lab tested" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                  <Icon className="h-5 w-5 text-brand-emerald" />
                  <p className="text-xs font-semibold leading-tight">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-14">
          <div className="flex gap-6 border-b border-border">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "relative -mb-px pb-3 text-sm font-semibold transition-colors",
                  tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
                {t === "Reviews" && <span className="ml-1 text-muted-foreground">({reviewCount.toLocaleString()})</span>}
                {tab === t && (
                  <motion.span layoutId="pdp-tab" className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-emerald" />
                )}
              </button>
            ))}
          </div>

          <div className="py-6">
            {tab === "Description" && (
              <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>{product.description}</p>
                {product.directions && <p><strong className="text-foreground">Directions:</strong> {product.directions}</p>}
                {product.warnings && <p><strong className="text-foreground">Warnings:</strong> {product.warnings}</p>}
              </div>
            )}

            {tab === "Highlights" && (
              <ul className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                {(product.benefits.length ? product.benefits : product.ingredients).map((h) => (
                  <li key={h} className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-emerald" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}

            {tab === "Reviews" && (
              <div className="max-w-3xl">
                {/* Summary */}
                <div className="mb-6 flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-muted/30 p-6">
                  <div className="text-center">
                    <p className="text-4xl font-black">{rating.toFixed(1)}</p>
                    <Stars rating={rating} className="mt-1 justify-center" />
                    <p className="mt-1 text-xs text-muted-foreground">{reviewCount.toLocaleString()} reviews</p>
                  </div>
                  <div className="flex-1 min-w-45 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((n) => {
                      const dist = product.reviewSummary.distribution.find((d) => d.star === n);
                      const pct = reviewCount > 0 ? Math.round(((dist?.count ?? 0) / reviewCount) * 100) : 0;
                      return (
                        <div key={n} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-muted-foreground">{n}</span>
                          <Star className="h-3 w-3 fill-brand-orange text-brand-orange" />
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-brand-orange" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Review list */}
                <div className="space-y-5">
                  {MOCK_REVIEWS.map((r) => (
                    <div key={r.name} className="border-b border-border pb-5 last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{r.name}</span>
                          {r.verified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-emerald/10 px-2 py-0.5 text-[10px] font-semibold text-brand-emerald-dark">
                              <Check className="h-2.5 w-2.5" /> Verified
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                      </div>
                      <Stars rating={r.rating} className="mt-1.5" />
                      <p className="mt-2 text-sm font-semibold">{r.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{r.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-6 text-2xl font-black tracking-tight">You may also like</h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
              {related.map((p) => (
                <ProductCard
                  key={p._id}
                  id={p._id}
                  name={p.name}
                  slug={p.slug}
                  price={p.basePrice}
                  compareAtPrice={p.compareAtPrice}
                  rating={p.reviewSummary.average}
                  reviewCount={p.reviewSummary.count}
                  badge={deriveBadge(p)}
                  image={p.images[0]}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
