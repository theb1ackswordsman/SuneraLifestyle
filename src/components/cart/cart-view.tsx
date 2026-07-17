"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X, ShoppingBag, Tag, ArrowRight, Truck } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MOCK_PRODUCTS } from "@/data/mock/homepage";

interface Line {
  id: string;
  name: string;
  slug: string;
  image?: string;
  size: string;
  price: number;
  compareAtPrice?: number;
  qty: number;
}

const SEED: { slug: string; size: string; qty: number }[] = [
  { slug: "sunera-immunity-kadha", size: "100 g", qty: 1 },
  { slug: "sanjivani-vedic-slim-fit-powder", size: "100 g", qty: 2 },
  { slug: "anarkali-cotton-kurti-emerald", size: "M", qty: 1 },
];

function pick(slug: string): Omit<Line, "size" | "qty"> | null {
  const p = MOCK_PRODUCTS.find((x) => x.slug === slug);
  if (!p) return null;
  return { id: p.id, name: p.name, slug: p.slug, image: p.image, price: p.price, compareAtPrice: p.compareAtPrice };
}

const INITIAL: Line[] = SEED.flatMap(({ slug, size, qty }) => {
  const base = pick(slug);
  return base ? [{ ...base, size, qty }] : [];
});

const FREE_SHIP_THRESHOLD = 999;
const SHIPPING_FEE = 79;

export function CartView() {
  const [lines, setLines] = useState<Line[]>(INITIAL);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");

  function setQty(id: string, delta: number) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, l.qty + delta) } : l))
    );
  }
  function remove(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }
  function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const code = coupon.trim().toUpperCase();
    if (code === "WELCOME15") {
      setAppliedCoupon(code);
      setCouponError("");
    } else if (code) {
      setAppliedCoupon(null);
      setCouponError("Invalid or expired code.");
    }
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const savings = lines.reduce(
    (s, l) => s + (l.compareAtPrice ? (l.compareAtPrice - l.price) * l.qty : 0),
    0
  );
  const couponDiscount = appliedCoupon ? Math.round(subtotal * 0.15) : 0;
  const shipping = subtotal >= FREE_SHIP_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const total = Math.max(0, subtotal - couponDiscount) + shipping;
  const remainingForFree = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
  const freeShipPct = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100);

  if (lines.length === 0) {
    return (
      <div className="pt-20 lg:pt-24">
        <div className="container-padded flex flex-col items-center justify-center py-24 text-center">
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
        <p className="mt-1 text-sm text-muted-foreground">{lines.length} item{lines.length > 1 ? "s" : ""} in your cart</p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Lines */}
          <div className="lg:col-span-2">
            {/* Free shipping progress */}
            <div className="mb-6 rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-brand-emerald" />
                {remainingForFree > 0 ? (
                  <span>Add <strong>{formatPrice(remainingForFree)}</strong> more for <strong>free delivery</strong></span>
                ) : (
                  <span className="font-semibold text-brand-emerald-dark">You&apos;ve unlocked free delivery! 🎉</span>
                )}
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-brand-emerald"
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
                    key={l.id}
                    layout
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-4 p-4"
                  >
                    <Link href={`/product/${l.slug}`} className="shrink-0">
                      <div className="h-24 w-24 overflow-hidden rounded-xl bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={l.image} alt={l.name} className="h-full w-full object-cover" />
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link href={`/product/${l.slug}`} className="text-sm font-semibold hover:text-brand-emerald transition-colors line-clamp-2">
                            {l.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">Size: {l.size}</p>
                        </div>
                        <button
                          onClick={() => remove(l.id)}
                          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                          aria-label={`Remove ${l.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-end justify-between pt-3">
                        <div className="flex items-center rounded-lg border border-border">
                          <button onClick={() => setQty(l.id, -1)} className="flex h-8 w-8 items-center justify-center rounded-l-lg transition-colors hover:bg-muted" aria-label="Decrease">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{l.qty}</span>
                          <button onClick={() => setQty(l.id, 1)} className="flex h-8 w-8 items-center justify-center rounded-r-lg transition-colors hover:bg-muted" aria-label="Increase">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatPrice(l.price * l.qty)}</p>
                          {l.compareAtPrice && (
                            <p className="text-xs text-muted-foreground line-through">{formatPrice(l.compareAtPrice * l.qty)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <Link href="/shop" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-emerald hover:gap-2.5 transition-all">
              <ArrowRight className="h-4 w-4 rotate-180" /> Continue Shopping
            </Link>
          </div>

          {/* Summary */}
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
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="Coupon code"
                      className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20"
                    />
                  </div>
                  <Button type="submit" variant="outline" size="default" className="h-10">Apply</Button>
                </div>
                {couponError && <p className="mt-1.5 text-xs text-destructive">{couponError}</p>}
                {appliedCoupon && (
                  <p className="mt-1.5 text-xs font-semibold text-brand-emerald-dark">
                    Code {appliedCoupon} applied — 15% off!
                  </p>
                )}
                <p className="mt-1.5 text-[11px] text-muted-foreground">Try <span className="font-mono font-semibold">WELCOME15</span></p>
              </form>

              <div className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm">
                <Row label="Subtotal" value={formatPrice(subtotal)} />
                {savings > 0 && <Row label="Product savings" value={`− ${formatPrice(savings)}`} accent />}
                {couponDiscount > 0 && <Row label={`Coupon (${appliedCoupon})`} value={`− ${formatPrice(couponDiscount)}`} accent />}
                <Row label="Shipping" value={shipping === 0 ? "FREE" : formatPrice(shipping)} />
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

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", accent && "text-brand-emerald-dark")}>{value}</span>
    </div>
  );
}
