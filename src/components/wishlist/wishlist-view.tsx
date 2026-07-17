"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, ShoppingBag, Check, Star, ArrowRight } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_PRODUCTS } from "@/data/mock/homepage";

const INITIAL_SLUGS = [
  "whey-protein-isolate-chocolate",
  "compression-tights-black",
  "resistance-band-set",
  "pre-workout-energy-blast",
];

const BADGE_LABEL: Record<string, string> = {
  new: "New", sale: "Sale", bestseller: "Bestseller", featured: "Featured",
};

export function WishlistView() {
  const [items, setItems] = useState(
    MOCK_PRODUCTS.filter((p) => INITIAL_SLUGS.includes(p.slug))
  );
  const [added, setAdded] = useState<Record<string, boolean>>({});

  function remove(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }
  function addToCart(id: string) {
    setAdded((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [id]: false })), 1600);
  }

  if (items.length === 0) {
    return (
      <div className="pt-20 lg:pt-24">
        <div className="container-padded flex flex-col items-center justify-center py-24 text-center">
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
            <p className="mt-1 text-sm text-muted-foreground">{items.length} saved item{items.length > 1 ? "s" : ""}</p>
          </div>
          <Button variant="outline" onClick={() => items.forEach((p) => addToCart(p.id))}>
            <ShoppingBag className="h-4 w-4" /> Add all to cart
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {items.map((p) => {
              const discount =
                p.compareAtPrice && p.compareAtPrice > p.price
                  ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
                  : null;
              return (
                <motion.div
                  key={p.id}
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background"
                >
                  {/* Remove */}
                  <button
                    onClick={() => remove(p.id)}
                    aria-label={`Remove ${p.name}`}
                    className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm transition-all hover:bg-background hover:scale-110"
                  >
                    <X className="h-4 w-4 text-foreground/70" />
                  </button>

                  <Link href={`/product/${p.slug}`} className="block">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      {p.badge && (
                        <div className="absolute left-2.5 top-2.5">
                          <Badge variant={p.badge === "sale" ? "sale" : p.badge === "new" ? "new" : "bestseller"} className="text-[11px]">
                            {BADGE_LABEL[p.badge]}{discount && p.badge === "sale" ? ` −${discount}%` : ""}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-3.5">
                    <Link href={`/product/${p.slug}`}>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug hover:text-brand-emerald transition-colors">{p.name}</h3>
                    </Link>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-brand-orange text-brand-orange" />
                      {p.rating} · {p.reviewCount.toLocaleString()}
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-black">{formatPrice(p.price)}</span>
                      {p.compareAtPrice && (
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(p.compareAtPrice)}</span>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(p.id)}
                      className={cn(
                        "mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                        added[p.id]
                          ? "bg-brand-emerald text-white"
                          : "bg-foreground text-background hover:bg-foreground/90"
                      )}
                    >
                      {added[p.id] ? (<><Check className="h-4 w-4" /> Added!</>) : (<><ShoppingBag className="h-4 w-4" /> Add to Cart</>)}
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
