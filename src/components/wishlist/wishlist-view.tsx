"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, ShoppingBag, Check, Star, ArrowRight, Loader2 } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getWishlistIds, removeFromWishlist, addToCart,
} from "@/lib/cart-wishlist-store";

interface WishlistProduct {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice?: number;
  images: string[];
  isNewArrival: boolean;
  isBestSeller: boolean;
  reviewSummary: { average: number; count: number };
}

export function WishlistView() {
  const [items,   setItems]   = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [added,   setAdded]   = useState<Record<string, boolean>>({});

  const loadWishlist = useCallback(async () => {
    const ids = getWishlistIds();
    if (!ids.length) { setItems([]); setLoading(false); return; }

    try {
      const res  = await fetch(`/api/products/batch?ids=${ids.join(",")}`);
      const json = await res.json();
      // Preserve wishlist order
      const map = new Map<string, WishlistProduct>(
        (json.data ?? []).map((p: WishlistProduct) => [p._id, p])
      );
      setItems(ids.flatMap((id) => (map.has(id) ? [map.get(id)!] : [])));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
    const sync = () => loadWishlist();
    window.addEventListener("sunera:wishlist-updated", sync);
    return () => window.removeEventListener("sunera:wishlist-updated", sync);
  }, [loadWishlist]);

  function handleRemove(id: string) {
    removeFromWishlist(id);
    setItems((prev) => prev.filter((p) => p._id !== id));
  }

  function handleAddToCart(id: string) {
    addToCart(id);
    setAdded((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [id]: false })), 1600);
  }

  function handleAddAll() {
    items.forEach((p) => addToCart(p._id));
    const all = Object.fromEntries(items.map((p) => [p._id, true]));
    setAdded(all);
    setTimeout(() => setAdded({}), 1600);
  }

  if (loading) {
    return (
      <div className="pt-20 lg:pt-24">
        <div className="container-padded flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="pt-20 lg:pt-24">
        <div className="container-padded flex flex-col items-center justify-center py-28 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <Heart className="h-9 w-9 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-black">Your wishlist is empty</h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Save the products you love by tapping the heart — they&apos;ll show up here.
          </p>
          <Link href="/shop" className="mt-6">
            <Button variant="primary" size="lg">Explore Products <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 lg:pt-24">
      <div className="container-padded py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">My Wishlist</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {items.length} saved item{items.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="outline" onClick={handleAddAll}>
            <ShoppingBag className="h-4 w-4" /> Add all to cart
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {items.map((p) => {
              const discount =
                p.compareAtPrice && p.compareAtPrice > p.basePrice
                  ? Math.round(((p.compareAtPrice - p.basePrice) / p.compareAtPrice) * 100)
                  : null;

              const badge = p.isBestSeller ? "bestseller" : p.isNewArrival ? "new" : discount ? "sale" : null;

              return (
                <motion.div
                  key={p._id}
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background"
                >
                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(p._id)}
                    aria-label={`Remove ${p.name}`}
                    className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm transition-all hover:bg-background hover:scale-110"
                  >
                    <X className="h-4 w-4 text-foreground/70" />
                  </button>

                  <Link href={`/product/${p.slug}`} className="block">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {p.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#1a5c14]/5">
                          <Heart className="h-12 w-12 text-[#1a5c14]/20" />
                        </div>
                      )}
                      {badge && (
                        <div className="absolute left-2.5 top-2.5">
                          <Badge
                            variant={badge === "sale" ? "sale" : badge === "new" ? "new" : "bestseller"}
                            className="text-[11px]"
                          >
                            {badge === "sale" && discount ? `Sale −${discount}%` : badge === "new" ? "New" : "Bestseller"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-3.5">
                    <Link href={`/product/${p.slug}`}>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug hover:text-[#1a5c14] transition-colors">
                        {p.name}
                      </h3>
                    </Link>

                    {p.reviewSummary.count > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {p.reviewSummary.average.toFixed(1)}
                        <span className="text-muted-foreground/60">· {p.reviewSummary.count.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-black">{formatPrice(p.basePrice)}</span>
                      {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(p.compareAtPrice)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(p._id)}
                      className={cn(
                        "mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                        added[p._id]
                          ? "bg-[#1a5c14] text-white"
                          : "bg-foreground text-background hover:bg-foreground/90"
                      )}
                    >
                      {added[p._id]
                        ? <><Check className="h-4 w-4" /> Added!</>
                        : <><ShoppingBag className="h-4 w-4" /> Add to Cart</>
                      }
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
