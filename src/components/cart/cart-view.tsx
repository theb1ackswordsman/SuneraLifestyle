"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X, ShoppingBag, Tag, ArrowRight, Truck, Loader2, Check } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  getCartItems, setCartQty, removeFromCart,
} from "@/lib/cart-wishlist-store";

interface CartProduct {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice?: number;
  images: string[];
  stock: number;
}

interface Line extends CartProduct { qty: number }

const FREE_SHIP_THRESHOLD = 999;
const SHIPPING_FEE        = 79;

export function CartView() {
  const [lines,   setLines]   = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);

  const [coupon,        setCoupon]        = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError,   setCouponError]   = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const loadCart = useCallback(async () => {
    const items = getCartItems();
    if (!items.length) { setLines([]); setLoading(false); return; }

    const ids = items.map((i) => i.productId).join(",");
    try {
      const res  = await fetch(`/api/products/batch?ids=${ids}`);
      const json = await res.json();
      const products: CartProduct[] = json.data ?? [];

      const merged: Line[] = items.flatMap(({ productId, qty }) => {
        const p = products.find((x) => x._id === productId);
        return p ? [{ ...p, qty }] : [];
      });
      setLines(merged);
    } catch {
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
    const sync = () => loadCart();
    window.addEventListener("sunera:cart-updated", sync);
    return () => window.removeEventListener("sunera:cart-updated", sync);
  }, [loadCart]);

  function handleQty(id: string, qty: number) {
    setCartQty(id, qty);
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l._id !== id)
        : prev.map((l) => l._id === id ? { ...l, qty } : l)
    );
  }

  function handleRemove(id: string) {
    removeFromCart(id);
    setLines((prev) => prev.filter((l) => l._id !== id));
  }

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderTotal: subtotal }),
      });
      const json = await res.json();
      if (json.success) {
        setAppliedCoupon(code);
        setCouponDiscount(json.data.discount ?? 0);
        setCouponError("");
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponError(json.error ?? "Invalid or expired code.");
      }
    } catch {
      setCouponError("Could not validate coupon. Try again.");
    } finally {
      setCouponLoading(false);
    }
  }

  const subtotal = lines.reduce((s, l) => s + l.basePrice * l.qty, 0);
  const savings  = lines.reduce((s, l) => s + (l.compareAtPrice && l.compareAtPrice > l.basePrice ? (l.compareAtPrice - l.basePrice) * l.qty : 0), 0);
  const shipping       = subtotal >= FREE_SHIP_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const total          = Math.max(0, subtotal - couponDiscount) + shipping;
  const remainingFree  = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
  const freeShipPct    = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100);

  if (loading) {
    return (
      <div className="pt-20 lg:pt-24">
        <div className="container-padded flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="pt-20 lg:pt-24">
        <div className="container-padded flex flex-col items-center justify-center py-28 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <ShoppingBag className="h-9 w-9 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-black">Your cart is empty</h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Looks like you haven&apos;t added anything yet. Let&apos;s fix that.
          </p>
          <Link href="/shop" className="mt-6">
            <Button variant="primary" size="lg">Start Shopping <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 lg:pt-24">
      <div className="container-padded py-8">
        <h1 className="text-3xl font-black tracking-tight">Shopping Cart</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lines.length} item{lines.length > 1 ? "s" : ""} in your cart
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Line items */}
          <div className="lg:col-span-2">
            {/* Free shipping progress */}
            <div className="mb-6 rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-[#1a5c14]" />
                {remainingFree > 0 ? (
                  <span>Add <strong>{formatPrice(remainingFree)}</strong> more for <strong>free delivery</strong></span>
                ) : (
                  <span className="font-semibold text-[#1a5c14]">You&apos;ve unlocked free delivery! 🎉</span>
                )}
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-[#1a5c14]"
                  initial={false}
                  animate={{ width: `${freeShipPct}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 30 }}
                />
              </div>
            </div>

            <ul className="divide-y divide-border rounded-2xl border border-border">
              <AnimatePresence initial={false}>
                {lines.map((l) => (
                  <motion.li
                    key={l._id}
                    layout
                    exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-4 p-4"
                  >
                    <Link href={`/product/${l.slug}`} className="shrink-0">
                      <div className="h-24 w-24 overflow-hidden rounded-xl bg-muted">
                        {l.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.images[0]} alt={l.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#1a5c14]/5">
                            <ShoppingBag className="h-8 w-8 text-[#1a5c14]/20" />
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/product/${l.slug}`}
                          className="text-sm font-semibold hover:text-[#1a5c14] transition-colors line-clamp-2"
                        >
                          {l.name}
                        </Link>
                        <button
                          onClick={() => handleRemove(l._id)}
                          className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                          aria-label={`Remove ${l.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-end justify-between pt-3">
                        <div className="flex items-center rounded-lg border border-border">
                          <button
                            onClick={() => handleQty(l._id, l.qty - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-l-lg transition-colors hover:bg-muted"
                            aria-label="Decrease"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{l.qty}</span>
                          <button
                            onClick={() => handleQty(l._id, l.qty + 1)}
                            disabled={l.stock > 0 && l.qty >= l.stock}
                            className="flex h-8 w-8 items-center justify-center rounded-r-lg transition-colors hover:bg-muted disabled:opacity-40"
                            aria-label="Increase"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatPrice(l.basePrice * l.qty)}</p>
                          {l.compareAtPrice && l.compareAtPrice > l.basePrice && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatPrice(l.compareAtPrice * l.qty)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <Link
              href="/shop"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a5c14] hover:gap-2.5 transition-all"
            >
              <ArrowRight className="h-4 w-4 rotate-180" /> Continue Shopping
            </Link>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-background p-6">
              <h2 className="text-lg font-bold">Order Summary</h2>

              {/* Coupon */}
              <form onSubmit={applyCoupon} className="mt-5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={coupon}
                      onChange={(e) => { setCoupon(e.target.value); setCouponError(""); }}
                      placeholder="Coupon code"
                      className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20"
                    />
                  </div>
                  <Button type="submit" variant="outline" size="default" className="h-10 shrink-0" disabled={couponLoading}>
                    {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
                {couponError && <p className="mt-1.5 text-xs text-destructive">{couponError}</p>}
                {appliedCoupon && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-[#1a5c14]">
                    <Check className="h-3.5 w-3.5" /> Code {appliedCoupon} applied — saving {formatPrice(couponDiscount)}!
                  </p>
                )}
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Try <span className="font-mono font-semibold">SUNERA10</span>
                </p>
              </form>

              <div className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm">
                <PriceRow label="Subtotal"                     value={formatPrice(subtotal)} />
                {savings > 0 && <PriceRow label="Product savings" value={`− ${formatPrice(savings)}`} accent />}
                {couponDiscount > 0 && <PriceRow label={`Coupon (${appliedCoupon})`} value={`− ${formatPrice(couponDiscount)}`} accent />}
                <PriceRow label="Shipping" value={shipping === 0 ? "FREE" : formatPrice(shipping)} />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-base font-bold">Total</span>
                <span className="text-xl font-black">{formatPrice(total)}</span>
              </div>

              <Link href="/checkout" className="mt-5 block">
                <Button variant="primary" size="lg" className="w-full">
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                🔒 Secure SSL-encrypted checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", accent && "text-[#1a5c14]")}>{value}</span>
    </div>
  );
}
