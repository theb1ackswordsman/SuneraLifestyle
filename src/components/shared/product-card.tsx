"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { addToCart, toggleWishlist, isWishlisted } from "@/lib/cart-wishlist-store";
import { useRequireAuth } from "@/hooks/use-auth";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  badge?: "new" | "sale" | "bestseller" | "featured";
  gradient?: string;
  image?: string;
  className?: string;
  onAddToCart?: (id: string) => void;
  onWishlist?: (id: string) => void;
}

const BADGE_CONFIG = {
  new: { label: "New", variant: "new" as const },
  sale: { label: "Sale", variant: "sale" as const },
  bestseller: { label: "Bestseller", variant: "bestseller" as const },
  featured: { label: "Featured", variant: "emerald" as const },
};

export function ProductCard({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  rating,
  reviewCount,
  badge,
  gradient = "from-[#1a5c14] to-[#071f04]",
  image,
  className,
  onAddToCart,
  onWishlist,
}: ProductCardProps) {
  const [wishlisted,  setWishlisted]  = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { requireAuth } = useRequireAuth();

  // Hydrate wishlist state from localStorage after mount
  useEffect(() => { setWishlisted(isWishlisted(id)); }, [id]);

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    requireAuth(() => {
      const added = toggleWishlist(id);
      setWishlisted(added);
      onWishlist?.(id);
    });
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    requireAuth(() => {
      addToCart(id);
      setAddedToCart(true);
      onAddToCart?.(id);
      setTimeout(() => setAddedToCart(false), 1500);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className={cn("group relative flex flex-col", className)}
    >
      <Link href={`/product/${slug}`} className="flex flex-col flex-1">
        {/* Image area */}
        <div className="relative overflow-hidden rounded-2xl aspect-3/4 bg-muted">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className={cn(
                "h-full w-full bg-linear-to-br transition-transform duration-500 group-hover:scale-105",
                gradient
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <ShoppingBag className="h-20 w-20 text-white" />
              </div>
            </div>
          )}

          {/* Top overlays */}
          <div className="absolute inset-x-3 top-3 flex items-start justify-between">
            {badge && (
              <Badge variant={BADGE_CONFIG[badge].variant} className="text-[11px]">
                {BADGE_CONFIG[badge].label}
                {discountPercent && badge === "sale" ? ` −${discountPercent}%` : ""}
              </Badge>
            )}
            <button
              onClick={handleWishlist}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className={cn(
                "ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm transition-all",
                "hover:bg-background hover:scale-110",
                wishlisted && "bg-rose-50 dark:bg-rose-950"
              )}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  wishlisted ? "fill-rose-500 text-rose-500" : "text-foreground/60"
                )}
              />
            </button>
          </div>

          {/* Add to Cart — always visible on mobile, hover-reveal on desktop */}
          <div className="absolute inset-x-3 bottom-3 translate-y-0 opacity-100 transition-all duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
            <button
              onClick={handleAddToCart}
              className={cn(
                "w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                addedToCart
                  ? "bg-brand-emerald text-white"
                  : "bg-background/95 backdrop-blur-sm text-foreground hover:bg-brand-emerald hover:text-white"
              )}
            >
              {addedToCart ? "Added!" : "Add to Cart"}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 flex flex-col gap-1.5 px-0.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground group-hover:text-brand-emerald transition-colors">
            {name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < Math.floor(rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted text-muted"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({reviewCount.toLocaleString()})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">{formatPrice(price)}</span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(compareAtPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
