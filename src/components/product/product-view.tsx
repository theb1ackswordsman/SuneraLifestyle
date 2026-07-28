"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Star, Heart, ShoppingBag, Check, Truck, RefreshCw, ShieldCheck,
  Minus, Plus, ChevronRight, BellRing,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/shared/product-card";
import type { ProductDetail, RelatedProduct } from "@/lib/shop/query-product";
import { useRequireAuth } from "@/hooks/use-auth";
import { addToCart as cartAdd, toggleWishlist, isWishlisted } from "@/lib/cart-wishlist-store";
import { ReviewSection } from "@/components/product/review-section";

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

const TABS = ["Description", "Highlights"] as const;

function deriveBadge(p: ProductDetail | RelatedProduct): "new" | "sale" | "bestseller" | undefined {
  if (p.isBestSeller) return "bestseller";
  if (p.isNewArrival) return "new";
  return undefined;
}

export function ProductView({ product, related }: { product: ProductDetail; related: RelatedProduct[] }) {
  // Combine explicit product.colorGalleries and variant color galleries
  const colorOptions = useMemo(() => {
    const list: Array<{ name: string; hex?: string; images: string[] }> = [];

    // 1. From product.colorGalleries
    if (product.colorGalleries && product.colorGalleries.length > 0) {
      for (const cg of product.colorGalleries) {
        if (cg.color && !list.some((c) => c.name.toLowerCase() === cg.color.toLowerCase())) {
          list.push({ name: cg.color, hex: cg.colorHex, images: cg.images ?? [] });
        }
      }
    }

    // 2. From product.variants
    for (const v of product.variants) {
      if (v.color) {
        const colorName = v.color.trim();
        const existing = list.find((c) => c.name.toLowerCase() === colorName.toLowerCase());
        const vImages = Array.isArray(v.images) ? v.images.filter(Boolean) : [];
        if (!existing) {
          list.push({ name: colorName, hex: v.colorHex, images: vImages });
        } else if (vImages.length > 0) {
          vImages.forEach((img) => { if (!existing.images.includes(img)) existing.images.push(img); });
        }
      }
    }
    return list;
  }, [product.colorGalleries, product.variants]);

  const [selectedColor, setSelectedColor] = useState(colorOptions[0]?.name ?? "");

  // Determine active gallery images (if selected color has specific images, display them; else fallback to main images)
  const activeColorObj = colorOptions.find((c) => c.name.toLowerCase() === selectedColor.toLowerCase());
  const activeColorImages = activeColorObj?.images ?? [];
  const gallery = activeColorImages.length > 0 ? activeColorImages : product.images.length > 0 ? product.images : [];

  // Deduplicated sizes for the selected color (or all sizes)
  const availableVariants = selectedColor
    ? product.variants.filter((v) => !v.color || v.color.toLowerCase() === selectedColor.toLowerCase())
    : product.variants;

  const variantSizes = (availableVariants.length > 0 ? availableVariants : product.variants)
    .filter((v) => v.size)
    .reduce<Array<{ size: string; stock: number; price?: number }>>((acc, v) => {
      if (!acc.find((x) => x.size === v.size)) {
        acc.push({ size: v.size as string, stock: v.stock, price: v.price });
      }
      return acc;
    }, []);

  // Smart label: pack sizes are always "<number><unit>", clothing sizes are not
  const variantLabel = variantSizes.some((v) => /^\d+\s*(ml|L|g|kg)$/i.test(v.size)) ? "Pack Size" : "Size";

  const badge = deriveBadge(product);
  const rating = product.reviewSummary.average;
  const reviewCount = product.reviewSummary.count;
  const outOfStock = product.stock <= 0;

  const router = useRouter();
  const { user, requireAuth } = useRequireAuth();

  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(variantSizes[0]?.size ?? "");
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Description");

  // Hydrate wishlist state from localStorage after mount
  useEffect(() => { setWishlisted(isWishlisted(String(product._id))); }, [product._id]);

  // Handle color change and reset active image index to 0
  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
    setActiveImg(0);
    // Auto-select first available size for this color
    const newColorVariants = product.variants.filter((v) => v.color?.toLowerCase() === colorName.toLowerCase());
    const firstSize = newColorVariants.find((v) => v.size)?.size;
    if (firstSize) setSelectedSize(firstSize);
  };

  // Price from selected variant (if it has an override), else base price
  const activeVariant = availableVariants.find((v) => String(v.size ?? "").trim() === String(selectedSize ?? "").trim());
  const displayPrice = activeVariant?.price != null && activeVariant.price > 0 ? activeVariant.price : product.basePrice;

  const discount =
    product.compareAtPrice && product.compareAtPrice > displayPrice
      ? Math.round(((product.compareAtPrice - displayPrice) / product.compareAtPrice) * 100)
      : null;

  function addToCart() {
    if (!user) { requireAuth(() => {}); return; }
    cartAdd(String(product._id), qty, selectedSize || undefined, selectedColor || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function handleWishlist() {
    if (!user) { requireAuth(() => {}); return; }
    const added = toggleWishlist(String(product._id));
    setWishlisted(added);
  }

  function handleBuyNow() {
    if (!user) { requireAuth(() => {}); return; }
    const sizeParam = selectedSize ? `&size=${encodeURIComponent(selectedSize)}` : "";
    const colorParam = selectedColor ? `&color=${encodeURIComponent(selectedColor)}` : "";
    router.push(`/checkout?buyNow=${product._id}&qty=${qty}${sizeParam}${colorParam}`);
  }

  return (
    <div className="pt-28 sm:pt-32">
      <div className="container-padded py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 sm:mb-6 flex flex-wrap items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground line-clamp-1 max-w-[140px] sm:max-w-none">{product.name}</span>
        </nav>

        {/* Main */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_3fr] lg:gap-12">
          {/* Gallery */}
          <div className="flex flex-col gap-4 lg:max-w-sm">
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

              {/* Out of Stock overlay ribbon */}
              {outOfStock && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40" />
                  <span className="relative z-10 rotate-[-20deg] rounded bg-red-600 px-6 py-2 text-sm font-black uppercase tracking-widest text-white shadow-xl">
                    Out of Stock
                  </span>
                </div>
              )}

              {badge && !outOfStock && (
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
            <h1 className="mt-1.5 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="mt-3 flex items-center gap-2">
              <Stars rating={rating} />
              <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({reviewCount.toLocaleString()} reviews)</span>
            </div>

            {/* Price */}
            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-black">{formatPrice(displayPrice)}</span>
              {product.compareAtPrice && product.compareAtPrice > displayPrice && (
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

            {/* Quick Action Buttons right after Price */}
            {!outOfStock ? (
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <div className="flex items-center rounded-xl border border-border shrink-0 bg-background">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-11 w-9 items-center justify-center rounded-l-xl transition-colors hover:bg-muted"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-7 text-center text-xs font-bold">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="flex h-11 w-9 items-center justify-center rounded-r-xl transition-colors hover:bg-muted"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Button variant="primary" size="lg" onClick={addToCart} className="flex-1 min-w-[130px] h-11 text-xs font-bold">
                  {added ? (
                    <><Check className="h-4 w-4" /> Added to Cart</>
                  ) : (
                    <><ShoppingBag className="h-4 w-4" /> Add to Cart</>
                  )}
                </Button>

                <Button variant="default" size="lg" onClick={handleBuyNow} className="flex-1 min-w-[130px] h-11 text-xs font-bold bg-[#1a5c14] hover:bg-[#103a0c] text-white">
                  Buy Now
                </Button>

                <Button
                  variant="outline"
                  size="icon-lg"
                  onClick={handleWishlist}
                  aria-label="Add to wishlist"
                  className="h-11 w-11 shrink-0"
                >
                  <Heart className={cn("h-5 w-5", wishlisted && "fill-rose-500 text-rose-500")} />
                </Button>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <BellRing className="h-4 w-4 text-red-600" />
                </span>
                <div>
                  <p className="text-xs font-bold text-red-700">Out of Stock</p>
                  <p className="text-[11px] text-red-500 mt-0.5">We will inform you when back in stock.</p>
                </div>
              </div>
            )}

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

            {/* Color selector */}
            {colorOptions.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-semibold">Color: <span className="text-[#1a5c14] font-bold">{selectedColor}</span></p>
                <div className="flex flex-wrap gap-2.5">
                  {colorOptions.map((c) => {
                    const isSelected = selectedColor.toLowerCase() === c.name.toLowerCase();
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleColorChange(c.name)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all",
                          isSelected
                            ? "border-[#1a5c14] bg-[#1a5c14]/10 text-[#1a5c14] ring-2 ring-[#1a5c14]/20 shadow-xs"
                            : "border-border hover:border-foreground/30 bg-background text-foreground"
                        )}
                      >
                        {c.hex && (
                          <span
                            className="h-4 w-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                            style={{ backgroundColor: c.hex }}
                          />
                        )}
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size / Pack selector */}
            {variantSizes.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-semibold">{variantLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {variantSizes.map((v) => {
                    const oos = v.stock <= 0;
                    return (
                      <button
                        key={v.size}
                        onClick={() => !oos && setSelectedSize(v.size)}
                        disabled={oos}
                        title={oos ? "Out of stock" : undefined}
                        className={cn(
                          "relative min-w-11 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                          selectedSize === v.size && !oos
                            ? "border-brand-emerald bg-brand-emerald/10 text-brand-emerald-dark"
                            : oos
                            ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                            : "border-border hover:border-foreground/30"
                        )}
                      >
                        {v.size}
                        {oos && (
                          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-muted-foreground/40" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trust row */}
            <div className="mt-6 sm:mt-7 grid grid-cols-3 gap-2 sm:gap-3 border-t border-border pt-5 sm:pt-6">
              {[
                { icon: Truck, label: "Free delivery", sub: "Over ₹999" },
                { icon: RefreshCw, label: "7-day returns", sub: "Hassle-free" },
                { icon: ShieldCheck, label: "100% authentic", sub: "Lab tested" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-center">
                  <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-brand-emerald" />
                  <p className="text-[11px] sm:text-xs font-semibold leading-tight">{label}</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-14">
          <div className="flex gap-6 border-b border-border">
            {(["Description", "Highlights"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "relative -mb-px pb-3 text-sm font-semibold transition-colors",
                  tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
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
          </div>
        </div>

        {/* Customer Reviews — rendered before 'You may also like' (hidden if 0 reviews) */}
        <ReviewSection
          productId={product._id}
          productSlug={product.slug}
          initialSummary={product.reviewSummary}
        />

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
                  stock={p.stock}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
