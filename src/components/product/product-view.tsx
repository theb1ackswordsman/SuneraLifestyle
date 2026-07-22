"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Heart, ShoppingBag, Check, Truck, RefreshCw, ShieldCheck,
  Minus, Plus, ChevronRight, Loader2, ThumbsUp, User,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/shared/product-card";
import { addToCart, toggleWishlist, isWishlisted } from "@/lib/cart-wishlist-store";
import type { ProductDetail, RelatedProduct } from "@/lib/shop/query-product";

// ── types ────────────────────────────────────────────────────────────────────

interface ReviewData {
  _id: string;
  rating: number;
  title: string;
  body: string;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  images: string[];
  createdAt: string;
  reviewer: { name: string; avatar: string | null };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function Stars({ rating, size = "sm", className }: { rating: number; size?: "sm" | "md"; className?: string }) {
  const cls = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(cls, i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted")}
        />
      ))}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1)  return "Today";
  if (d < 7)  return `${d} day${d > 1 ? "s" : ""} ago`;
  if (d < 30) return `${Math.floor(d / 7)} week${Math.floor(d / 7) > 1 ? "s" : ""} ago`;
  if (d < 365)return `${Math.floor(d / 30)} month${Math.floor(d / 30) > 1 ? "s" : ""} ago`;
  return `${Math.floor(d / 365)} year${Math.floor(d / 365) > 1 ? "s" : ""} ago`;
}

const TABS = ["Description", "Ingredients", "Reviews"] as const;

// ── Reviews section (client-side fetched) ─────────────────────────────────

function ReviewsSection({ slug, summary }: {
  slug: string;
  summary: ProductDetail["reviewSummary"];
}) {
  const [reviews,    setReviews]    = useState<ReviewData[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(summary.count);

  const fetchReviews = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/products/${slug}/reviews?page=${p}`);
      const json = await res.json();
      if (res.ok) {
        setReviews((prev) => (p === 1 ? json.data : [...prev, ...json.data]));
        setTotalPages(json.totalPages);
        setTotal(json.total);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchReviews(1); }, [fetchReviews]);

  // Build distribution bars from summary (fill zeros for missing stars)
  const distMap: Record<number, number> = {};
  summary.distribution.forEach((d) => { distMap[d.star] = d.count; });
  const _maxDist = Math.max(...Object.values(distMap), 1);

  return (
    <div className="max-w-3xl">
      {/* Summary card */}
      <div className="mb-8 flex flex-wrap gap-8 rounded-2xl border border-border bg-muted/30 p-6">
        <div className="flex flex-col items-center justify-center text-center shrink-0">
          <p className="text-5xl font-black leading-none">{summary.average.toFixed(1)}</p>
          <Stars rating={summary.average} size="md" className="mt-2 justify-center" />
          <p className="mt-1.5 text-xs text-muted-foreground">{total.toLocaleString()} review{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 min-w-[160px] space-y-2">
          {[5, 4, 3, 2, 1].map((n) => {
            const cnt = distMap[n] ?? 0;
            const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
            return (
              <div key={n} className="flex items-center gap-2.5 text-xs">
                <span className="w-2 shrink-0 text-right text-muted-foreground">{n}</span>
                <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, delay: 0.1 * (5 - n) }}
                    className="h-full rounded-full bg-amber-400"
                  />
                </div>
                <span className="w-8 shrink-0 text-muted-foreground">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review list */}
      {loading && reviews.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Star className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="font-semibold text-foreground">No reviews yet</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first to review this product.</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {reviews.map((r) => (
              <div key={r._id} className="border-b border-border pb-6 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a5c14]/10">
                    {r.reviewer.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.reviewer.avatar} alt={r.reviewer.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-[#1a5c14]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{r.reviewer.name}</span>
                      {r.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1a5c14]/10 px-2 py-0.5 text-[10px] font-semibold text-[#1a5c14]">
                          <Check className="h-2.5 w-2.5" /> Verified Purchase
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                    </div>
                    <Stars rating={r.rating} />
                    <p className="mt-2 text-sm font-semibold">{r.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{r.body}</p>

                    {/* Review images */}
                    {r.images.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {r.images.map((img, idx) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={idx} src={img} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />
                        ))}
                      </div>
                    )}

                    {r.helpfulVotes > 0 && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <ThumbsUp className="h-3 w-3" /> {r.helpfulVotes} found this helpful
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {page < totalPages && (
            <button
              onClick={() => { const next = page + 1; setPage(next); fetchReviews(next); }}
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more reviews"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProductView({
  product,
  related,
}: {
  product: ProductDetail;
  related: RelatedProduct[];
}) {
  const gallery   = product.images.length ? product.images : [];
  const sizes     = [...new Set(product.variants.filter((v) => v.size).map((v) => v.size!))];
  const hasVariants = sizes.length > 0;

  const [activeImg,  setActiveImg]  = useState(0);
  const [size,       setSize]       = useState(sizes[0] ?? "");
  const [qty,        setQty]        = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [added,      setAdded]      = useState(false);
  const [tab,        setTab]        = useState<(typeof TABS)[number]>("Description");

  useEffect(() => { setWishlisted(isWishlisted(product._id)); }, [product._id]);

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.basePrice
      ? Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)
      : null;

  const badge = product.isBestSeller ? "bestseller" : product.isNewArrival ? "new" : discount ? "sale" : undefined;

  function handleAddToCart() {
    addToCart(product._id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function handleWishlist() {
    const added = toggleWishlist(product._id);
    setWishlisted(added);
  }

  return (
    <div className="pt-20 lg:pt-24">
      <div className="container-padded py-8">

        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          {product.category.name && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-foreground transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        {/* ── Product main ── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-14">

          {/* Gallery */}
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImg}
                initial={{ opacity: 0.5, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="relative aspect-square overflow-hidden rounded-2xl bg-muted"
              >
                {gallery[activeImg] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={gallery[activeImg]} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#1a5c14]/5">
                    <ShoppingBag className="h-20 w-20 text-[#1a5c14]/20" />
                  </div>
                )}
                {badge && (
                  <div className="absolute left-4 top-4">
                    <Badge variant={badge === "sale" ? "sale" : badge === "new" ? "new" : "bestseller"}>
                      {badge === "sale" ? `Sale −${discount}%` : badge === "new" ? "New" : "Bestseller"}
                    </Badge>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {gallery.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-xl bg-muted ring-2 transition-all",
                      i === activeImg ? "ring-[#1a5c14]" : "ring-transparent hover:ring-border"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="flex flex-col">
            {product.category.name && (
              <p className="text-xs font-bold uppercase tracking-widest text-[#1a5c14]">
                {product.category.name}
              </p>
            )}
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{product.name}</h1>

            {/* Rating summary */}
            <div className="mt-3 flex items-center gap-2">
              <Stars rating={product.reviewSummary.average} />
              <span className="text-sm font-semibold">{product.reviewSummary.average.toFixed(1)}</span>
              <button
                onClick={() => setTab("Reviews")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ({product.reviewSummary.count.toLocaleString()} reviews)
              </button>
            </div>

            {/* Price */}
            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-black">{formatPrice(product.basePrice)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
              {discount && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                  Save {discount}%
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes · Free delivery over ₹999</p>

            {/* Short description */}
            {(product.shortDescription || product.description) && (
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                {product.shortDescription ?? product.description}
              </p>
            )}

            {/* Top benefits */}
            {product.benefits.length > 0 && (
              <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {product.benefits.slice(0, 4).map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1a5c14]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Size selector */}
            {hasVariants && (
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
                          ? "border-[#1a5c14] bg-[#1a5c14]/10 text-[#1a5c14]"
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

              <Button variant="primary" size="lg" onClick={handleAddToCart} className="flex-1 min-w-[180px]">
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
                <Heart className={cn("h-5 w-5 transition-colors", wishlisted && "fill-rose-500 text-rose-500")} />
              </Button>
            </div>

            <Link href="/checkout" className="mt-3 block">
              <Button variant="default" size="lg" className="w-full">Buy It Now</Button>
            </Link>

            {/* Trust badges */}
            <div className="mt-7 grid grid-cols-3 gap-3 border-t border-border pt-6">
              {[
                { icon: Truck,       label: "Free delivery",   sub: "Over ₹999" },
                { icon: RefreshCw,   label: "7-day returns",   sub: "Hassle-free" },
                { icon: ShieldCheck, label: "100% authentic",  sub: "Lab tested" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                  <Icon className="h-5 w-5 text-[#1a5c14]" />
                  <p className="text-xs font-semibold leading-tight">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mt-14">
          <div className="flex gap-6 border-b border-border overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "relative shrink-0 -mb-px pb-3 text-sm font-semibold transition-colors",
                  tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
                {t === "Reviews" && product.reviewSummary.count > 0 && (
                  <span className="ml-1.5 text-muted-foreground">({product.reviewSummary.count})</span>
                )}
                {tab === t && (
                  <motion.span layoutId="pdp-tab" className="absolute inset-x-0 bottom-0 h-0.5 bg-[#1a5c14]" />
                )}
              </button>
            ))}
          </div>

          <div className="py-8">
            {tab === "Description" && (
              <div className="max-w-3xl space-y-6">
                <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                  <p>{product.description}</p>
                </div>

                {product.directions && (
                  <div>
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-foreground/60">How to Use</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{product.directions}</p>
                  </div>
                )}

                {product.warnings && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-700">Warnings</h3>
                    <p className="text-sm text-amber-800 leading-relaxed">{product.warnings}</p>
                  </div>
                )}

                {(product.shippingDetails || product.returnPolicy) && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {product.shippingDetails && (
                      <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-foreground/60 flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5" /> Shipping
                        </h3>
                        <p className="text-sm text-muted-foreground">{product.shippingDetails}</p>
                      </div>
                    )}
                    {product.returnPolicy && (
                      <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-foreground/60 flex items-center gap-1.5">
                          <RefreshCw className="h-3.5 w-3.5" /> Returns
                        </h3>
                        <p className="text-sm text-muted-foreground">{product.returnPolicy}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "Ingredients" && (
              <div className="max-w-3xl space-y-6">
                {product.benefits.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-foreground/60">Key Benefits</h3>
                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {product.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1a5c14]" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.ingredients.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-foreground/60">Ingredients</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.ingredients.map((ing) => (
                        <span key={ing} className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground/80">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {product.ingredients.length === 0 && product.benefits.length === 0 && (
                  <p className="text-sm text-muted-foreground">Ingredient details not available for this product.</p>
                )}
              </div>
            )}

            {tab === "Reviews" && (
              <ReviewsSection slug={product.slug} summary={product.reviewSummary} />
            )}
          </div>
        </div>

        {/* ── Related products ── */}
        {related.length > 0 && (
          <div className="mt-14 border-t border-border pt-12">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-2xl font-black tracking-tight">You may also like</h2>
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="text-sm font-semibold text-[#1a5c14] hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
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
                  badge={p.isBestSeller ? "bestseller" : p.isNewArrival ? "new" : undefined}
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
