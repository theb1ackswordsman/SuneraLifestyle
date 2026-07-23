"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag, MapPin, CreditCard, Truck, ChevronDown, ChevronRight,
  Check, Plus, Loader2, ShieldCheck, RefreshCw, Star, Package, Tag, X,
  AlertCircle, Percent, Gift, Zap,
} from "lucide-react";
// Truck kept for "Free shipping" trust badge in SuccessScreen
import { cn, formatPrice } from "@/lib/utils";
import { getCartItems, clearCart } from "@/lib/cart-wishlist-store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartProduct {
  _id: string; name: string; slug: string;
  basePrice: number; compareAtPrice?: number;
  images: string[]; stock: number;
}
interface Line extends CartProduct { qty: number }

interface SavedAddress {
  _id: string; label: string; name: string; phone: string;
  line1: string; line2?: string; city: string; state: string;
  pincode: string; isDefault: boolean;
}

interface PublicCoupon {
  _id: string; code: string; description: string;
  type: "percentage" | "flat" | "free_shipping";
  value: number; minOrderAmount: number;
  maxDiscountAmount?: number; endDate: string | null;
}

interface AppliedCoupon { code: string; description: string; discount: number }

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Delhi","Jammu and Kashmir",
  "Ladakh","Puducherry",
];

const FREE_SHIP = 999;
const SHIP_FEE  = 79;

// ─── Razorpay script loader ───────────────────────────────────────────────────

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src     = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function discountLabel(c: PublicCoupon) {
  if (c.type === "percentage") return `${c.value}% off${c.maxDiscountAmount ? ` (up to ₹${c.maxDiscountAmount})` : ""}`;
  if (c.type === "flat")       return `₹${c.value} off`;
  return "Free Shipping";
}

function SectionCard({ title, icon: Icon, children, className }: {
  title: string; icon: React.ElementType; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-background p-5 sm:p-6", className)}>
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1a5c14]/10">
          <Icon className="h-4 w-4 text-[#1a5c14]" />
        </div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InputField({ label, required, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean; error?: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/55">
        {label} {required && <span className="text-red-400">*</span>}
      </p>
      <input
        {...props}
        className={cn(
          "flex h-11 w-full rounded-xl border bg-background px-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5c14]/40",
          error ? "border-red-400" : "border-input",
          props.className,
        )}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Coupon Picker Modal ──────────────────────────────────────────────────────

function CouponPickerModal({ cartTotal, onApply, onClose }: {
  cartTotal: number;
  onApply: (applied: AppliedCoupon) => void;
  onClose: () => void;
}) {
  const [coupons,    setCoupons]    = useState<PublicCoupon[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [applying,   setApplying]   = useState<string | null>(null);
  const [error,      setError]      = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/coupons")
      .then((r) => r.json())
      .then((j) => setCoupons(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function applyCode(code: string) {
    const key = code.toUpperCase().trim();
    if (!key) return;
    setApplying(key);
    setError((e) => ({ ...e, [key]: "" }));
    try {
      const res  = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: key, cartTotal }),
      });
      const json = await res.json();
      if (!json.valid) {
        setError((e) => ({ ...e, [key]: json.error ?? "Invalid coupon." }));
      } else {
        onApply({ code: json.code, description: json.description, discount: json.discount });
        onClose();
      }
    } catch {
      setError((e) => ({ ...e, [key]: "Network error. Please try again." }));
    } finally {
      setApplying(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-100 p-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1a5c14]/10">
              <Tag className="h-4 w-4 text-[#1a5c14]" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Apply Coupon</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="shrink-0 border-b border-gray-100 p-4">
          <div className="flex gap-2">
            <input
              value={manualCode}
              onChange={(e) => { setManualCode(e.target.value.toUpperCase()); setError((e2) => ({ ...e2, MANUAL: "" })); }}
              onKeyDown={(e) => e.key === "Enter" && applyCode(manualCode)}
              placeholder="Enter coupon code"
              className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm font-mono uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-[#1a5c14]/30 focus:border-[#1a5c14]"
            />
            <button
              onClick={() => applyCode(manualCode)}
              disabled={!manualCode.trim() || applying === manualCode.toUpperCase().trim()}
              className="flex items-center gap-1.5 rounded-xl bg-[#1a5c14] px-4 text-sm font-bold text-white disabled:opacity-50 hover:bg-[#154a10] transition-colors"
            >
              {applying === manualCode.toUpperCase().trim()
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : "Apply"
              }
            </button>
          </div>
          {error.MANUAL && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" /> {error.MANUAL}
            </p>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Gift className="h-9 w-9 text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-500">No coupons available right now</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Offers</p>
              {coupons.map((c) => {
                const eligible = cartTotal >= c.minOrderAmount;
                const errKey   = c.code;
                return (
                  <div
                    key={c._id}
                    className={cn(
                      "rounded-2xl border-2 border-dashed p-4 transition-colors",
                      eligible ? "border-[#1a5c14]/30 bg-[#1a5c14]/3" : "border-gray-200 bg-gray-50 opacity-70"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", eligible ? "bg-[#1a5c14]/10" : "bg-gray-100")}>
                        {c.type === "percentage"   && <Percent className={cn("h-4 w-4", eligible ? "text-[#1a5c14]" : "text-gray-400")} />}
                        {c.type === "flat"          && <Tag     className={cn("h-4 w-4", eligible ? "text-[#1a5c14]" : "text-gray-400")} />}
                        {c.type === "free_shipping" && <Truck   className={cn("h-4 w-4", eligible ? "text-[#1a5c14]" : "text-gray-400")} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-black tracking-wider text-gray-900">{c.code}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", eligible ? "bg-[#1a5c14] text-white" : "bg-gray-200 text-gray-500")}>
                            {discountLabel(c)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-600">{c.description}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {c.minOrderAmount > 0 && (
                            <span className={cn("text-[11px]", eligible ? "text-gray-500" : "text-amber-600 font-semibold")}>
                              Min. ₹{c.minOrderAmount}{!eligible && ` (add ₹${c.minOrderAmount - cartTotal} more)`}
                            </span>
                          )}
                          {c.endDate && <span className="text-[11px] text-gray-400">Expires {fmtDate(c.endDate)}</span>}
                        </div>
                        {error[errKey] && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                            <AlertCircle className="h-3 w-3" /> {error[errKey]}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => applyCode(c.code)}
                        disabled={!eligible || applying === c.code}
                        className={cn(
                          "shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors",
                          eligible ? "bg-[#1a5c14] text-white hover:bg-[#154a10]" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        {applying === c.code ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ orderNumber }: { orderNumber: string }) {
  const eta = new Date(Date.now() + 5 * 86400000);
  const fmt = eta.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="pt-20 lg:pt-24">
      <div className="container-padded flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1a5c14]/10 mb-6">
          <Check className="h-10 w-10 text-[#1a5c14]" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-black tracking-tight">Order Placed!</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Payment received. Your order is confirmed and being processed.
        </p>

        <div className="mt-8 w-full max-w-md rounded-2xl border border-border bg-background p-6 text-left space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono font-bold text-foreground">{orderNumber}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimated Delivery</span>
            <span className="font-semibold text-foreground">{fmt}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payment</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              <Check className="h-3 w-3" /> Paid Online
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#1a5c14]/10 px-2.5 py-0.5 text-xs font-semibold text-[#1a5c14]">
              <Package className="h-3 w-3" /> Confirmed
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 w-full max-w-md text-sm">
          {[
            { icon: Truck,       label: "Free shipping",  sub: "On orders above ₹999" },
            { icon: RefreshCw,   label: "Easy returns",   sub: "7-day hassle-free returns" },
            { icon: ShieldCheck, label: "100% authentic", sub: "All products lab-tested" },
            { icon: Star,        label: "Earn rewards",   sub: "Points added to your account" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-border p-3.5">
              <Icon className="h-5 w-5 shrink-0 text-[#1a5c14]" />
              <div>
                <p className="font-semibold text-foreground leading-tight">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/account/orders" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
            Track Order
          </Link>
          <Link href="/shop" className="inline-flex items-center gap-2 rounded-xl bg-[#0f0f0f] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
            Continue Shopping <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CheckoutContent() {
  const [lines,        setLines]        = useState<Line[]>([]);
  const [cartLoading,  setCartLoading]  = useState(true);
  const [savedAddrs,   setSavedAddrs]   = useState<SavedAddress[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);
  const [showNewAddr,  setShowNewAddr]  = useState(false);
  const [email,        setEmail]        = useState("");
  const [userPhone,    setUserPhone]    = useState("");

  const [form, setForm] = useState({
    name:"", phone:"", line1:"", line2:"", city:"", state:"", pincode:"",
  });
  const [formErrors, setFormErrors] = useState<Partial<typeof form>>({});

  const [showCouponPicker, setShowCouponPicker] = useState(false);
  const [applied,          setApplied]          = useState<AppliedCoupon | null>(null);

  const [placing,   setPlacing]   = useState(false);
  const [orderDone, setOrderDone] = useState<string | null>(null);
  const [globalErr, setGlobalErr] = useState("");

  // ── Load cart ──────────────────────────────────────────────────────────────
  const loadCart = useCallback(async () => {
    const items = getCartItems();
    if (!items.length) { setLines([]); setCartLoading(false); return; }
    const ids = items.map((i) => i.productId).join(",");
    try {
      const res  = await fetch(`/api/products/batch?ids=${ids}`);
      const json = await res.json();
      const products: CartProduct[] = json.data ?? [];
      setLines(items.flatMap(({ productId, qty }) => {
        const p = products.find((x) => x._id === productId);
        return p ? [{ ...p, qty }] : [];
      }));
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setEmail(j.data.email ?? "");
          setUserPhone(j.data.phone ?? "");
        }
      })
      .catch(() => {});
    fetch("/api/user/addresses")
      .then((r) => r.json())
      .then((j) => {
        const addrs: SavedAddress[] = j.data ?? [];
        setSavedAddrs(addrs);
        const def = addrs.find((a) => a.isDefault) ?? addrs[0];
        if (def) setSelectedAddr(def._id);
        else setShowNewAddr(true);
      })
      .catch(() => setShowNewAddr(true));
  }, [loadCart]);

  // ── Totals ────────────────────────────────────────────────────────────────
  const subtotal       = lines.reduce((s, l) => s + l.basePrice * l.qty, 0);
  const couponDiscount = applied?.discount ?? 0;
  const shipping       = subtotal >= FREE_SHIP ? 0 : SHIP_FEE;
  const total          = Math.max(0, subtotal - couponDiscount) + shipping;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function setField(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setFormErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validateNewAddr(): boolean {
    const errs: Partial<typeof form> = {};
    if (!form.name.trim())              errs.name    = "Required";
    if (!form.line1.trim())             errs.line1   = "Required";
    if (!form.city.trim())              errs.city    = "Required";
    if (!form.state)                    errs.state   = "Select a state";
    if (!/^\d{6}$/.test(form.pincode)) errs.pincode = "6-digit pincode required";
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) errs.phone = "Invalid mobile number";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function buildOrderPayload() {
    const addr = showNewAddr || !selectedAddr
      ? { name: form.name, phone: form.phone, addressLine1: form.line1, addressLine2: form.line2, city: form.city, state: form.state, pincode: form.pincode }
      : (() => {
          const a = savedAddrs.find((x) => x._id === selectedAddr)!;
          return { name: a.name, phone: a.phone, addressLine1: a.line1, addressLine2: a.line2 ?? "", city: a.city, state: a.state, pincode: a.pincode };
        })();

    return {
      items: lines.map((l) => ({
        productId: l._id,
        name:      l.name,
        image:     l.images[0] ?? "",
        slug:      l.slug,
        price:     l.basePrice,
        quantity:  l.qty,
      })),
      shippingAddress:  addr,
      paymentMethod:    "razorpay",
      subtotal,
      couponCode:       applied?.code,
      couponDiscount:   couponDiscount,
      shippingFee:      shipping,
      total,
    };
  }

  // ── Place order ───────────────────────────────────────────────────────────
  async function handlePlace(e: React.FormEvent) {
    e.preventDefault();
    setGlobalErr("");

    if (!lines.length) { setGlobalErr("Your cart is empty."); return; }
    if (!email.trim()) { setGlobalErr("Please enter your email address."); return; }
    if (showNewAddr || !selectedAddr) {
      if (!validateNewAddr()) return;
    }

    setPlacing(true);

    try {
      const res  = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildOrderPayload()),
      });
      const json = await res.json();
      if (!res.ok) { setGlobalErr(json.error ?? "Failed to place order."); return; }

      const loaded = await loadRazorpayScript();
      if (!loaded) { setGlobalErr("Could not load payment gateway. Please try again."); return; }

      const addr = savedAddrs.find((x) => x._id === selectedAddr);
      const customerName  = addr?.name  || form.name  || "";
      const customerPhone = addr?.phone || form.phone || userPhone || "";

      const rzp = new window.Razorpay({
        key:         json.keyId,
        amount:      json.amount,
        currency:    json.currency,
        order_id:    json.razorpayOrderId,
        name:        "SunEra Lifestyle",
        description: `Order ${json.orderNumber}`,
        image:       "/sunera1.png",
        prefill: {
          name:    customerName,
          email,
          contact: customerPhone,
        },
        theme:  { color: "#1a5c14" },
        config: {
          display: {
            blocks: {
              upi: {
                instruments: [
                  { method: "upi", flows: ["vpa", "qr", "intent"] },
                ],
              },
            },
            preferences: { show_default_blocks: true },
          },
        },
        modal:  { ondismiss: () => { setPlacing(false); setGlobalErr("Payment cancelled. Your order has not been placed."); } },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // Verify on server
          const verifyRes  = await fetch("/api/orders", {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId:           json.orderId,
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const verifyJson = await verifyRes.json();
          if (!verifyRes.ok) {
            setGlobalErr(verifyJson.error ?? "Payment verification failed. Please contact support.");
            setPlacing(false);
            return;
          }
          clearCart();
          setOrderDone(verifyJson.orderNumber);
          setPlacing(false);
        },
      });
      rzp.open();
      // placing stays true until handler or ondismiss fires
      return;
    } catch {
      setGlobalErr("Something went wrong. Please try again.");
      setPlacing(false);
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!cartLoading && !lines.length && !orderDone) {
    return (
      <div className="pt-20 lg:pt-24">
        <div className="container-padded flex flex-col items-center justify-center py-28 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <ShoppingBag className="h-9 w-9 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-black">Nothing to checkout</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your cart is empty. Add some products first.</p>
          <Link href="/shop" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0f0f0f] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
            Shop Now <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (orderDone) return <SuccessScreen orderNumber={orderDone} />;

  return (
    <div className="pt-20 lg:pt-24">
      {showCouponPicker && (
        <CouponPickerModal
          cartTotal={subtotal}
          onApply={(a) => { setApplied(a); setShowCouponPicker(false); }}
          onClose={() => setShowCouponPicker(false)}
        />
      )}

      <div className="container-padded py-8 pb-16">
        <h1 className="text-3xl font-black tracking-tight mb-4">Checkout</h1>

        {/* Test-mode banner — only rendered when using a test key */}
        {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith("rzp_test_") && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
            <p className="font-bold mb-2">🧪 Razorpay Test Mode — use these credentials</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
              <div><span className="font-semibold not-italic font-sans">UPI ID:</span> success@razorpay</div>
              <div><span className="font-semibold not-italic font-sans">Fail UPI:</span> failure@razorpay</div>
              <div><span className="font-semibold not-italic font-sans">Card:</span> 4111 1111 1111 1111</div>
              <div><span className="font-semibold not-italic font-sans">Expiry / CVV:</span> any future date · any 3 digits</div>
            </div>
          </div>
        )}

        <form onSubmit={handlePlace}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8 lg:items-start">

            {/* ── LEFT ───────────────────────────────────────────────────── */}
            <div className="space-y-6 lg:col-span-2">

              {/* Contact */}
              <SectionCard title="Contact Information" icon={CreditCard}>
                <InputField
                  label="Email Address" type="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </SectionCard>

              {/* Address */}
              <SectionCard title="Delivery Address" icon={MapPin}>
                {savedAddrs.length > 0 && (
                  <div className="mb-5 space-y-2">
                    {savedAddrs.map((addr) => (
                      <label
                        key={addr._id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                          selectedAddr === addr._id && !showNewAddr
                            ? "border-[#1a5c14] bg-[#1a5c14]/3"
                            : "border-border hover:border-foreground/20"
                        )}
                      >
                        <input
                          type="radio" name="address" value={addr._id}
                          checked={selectedAddr === addr._id && !showNewAddr}
                          onChange={() => { setSelectedAddr(addr._id); setShowNewAddr(false); }}
                          className="mt-0.5 accent-[#1a5c14]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{addr.name}</span>
                            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{addr.label}</span>
                            {addr.isDefault && <span className="rounded-full bg-[#1a5c14]/10 px-2 py-0.5 text-[10px] font-semibold text-[#1a5c14]">Default</span>}
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} – {addr.pincode}
                          </p>
                          {addr.phone && <p className="text-xs text-muted-foreground mt-0.5">{addr.phone}</p>}
                        </div>
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setShowNewAddr((p) => !p); setSelectedAddr(null); }}
                      className="flex w-full items-center justify-between rounded-xl border border-dashed border-border p-4 text-sm font-semibold text-[#1a5c14] hover:border-[#1a5c14]/40 transition-colors"
                    >
                      <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Use a different address</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", showNewAddr && "rotate-180")} />
                    </button>
                  </div>
                )}
                {(showNewAddr || savedAddrs.length === 0) && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputField label="Full Name" required value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Recipient's name" error={formErrors.name} />
                    <InputField label="Phone Number" type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="10-digit mobile" error={formErrors.phone} />
                    <div className="sm:col-span-2">
                      <InputField label="Address Line 1" required value={form.line1} onChange={(e) => setField("line1", e.target.value)} placeholder="House / Flat No., Street, Area" error={formErrors.line1} />
                    </div>
                    <div className="sm:col-span-2">
                      <InputField label="Address Line 2" value={form.line2} onChange={(e) => setField("line2", e.target.value)} placeholder="Landmark, Colony (optional)" />
                    </div>
                    <InputField label="City" required value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="City" error={formErrors.city} />
                    <div>
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/55">State <span className="text-red-400">*</span></p>
                      <select
                        value={form.state} onChange={(e) => setField("state", e.target.value)}
                        className={cn("flex h-11 w-full rounded-xl border bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5c14]/40", formErrors.state ? "border-red-400" : "border-input")}
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {formErrors.state && <p className="mt-1 text-xs text-red-500">{formErrors.state}</p>}
                    </div>
                    <InputField label="Pincode" required value={form.pincode} onChange={(e) => setField("pincode", e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="6-digit pincode" error={formErrors.pincode} />
                  </div>
                )}
              </SectionCard>

              {/* Payment */}
              <SectionCard title="Payment" icon={Zap}>
                <div className="flex items-center gap-3 rounded-xl border border-[#1a5c14] bg-[#1a5c14]/3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">Pay Online via Razorpay</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">UPI · Cards · NetBanking · Wallets</p>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-800">
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>256-bit encrypted. Supports PhonePe, GPay, Paytm, all debit/credit cards, and NetBanking.</span>
                </div>
              </SectionCard>
            </div>

            {/* ── RIGHT — Order Summary ───────────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-bold mb-4">Order Summary</h2>

                {/* Coupon — always at top */}
                <div className="mb-4">
                  {applied ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl border-2 border-dashed border-[#1a5c14]/40 bg-[#1a5c14]/5 px-3.5 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1a5c14]/15">
                          <Tag className="h-3.5 w-3.5 text-[#1a5c14]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-[#1a5c14] font-mono tracking-wider">{applied.code}</p>
                          <p className="text-[11px] text-[#1a5c14]/70 font-medium">−{formatPrice(applied.discount)} saved</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setApplied(null)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1a5c14]/15 text-[#1a5c14] hover:bg-[#1a5c14]/25 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowCouponPicker(true)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-border px-3.5 py-3 text-sm font-semibold text-[#1a5c14] hover:border-[#1a5c14]/40 hover:bg-[#1a5c14]/3 transition-colors">
                      <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> Apply coupon or promo code</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Cart items */}
                {cartLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <ul className="divide-y divide-border -mx-1 mb-4">
                    {lines.map((l) => (
                      <li key={l._id} className="flex gap-3 py-3 px-1">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                          {l.images[0]
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={l.images[0]} alt={l.name} className="h-full w-full object-cover" />
                            : <div className="flex h-full w-full items-center justify-center"><ShoppingBag className="h-5 w-5 text-muted-foreground/30" /></div>
                          }
                          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                            {l.qty}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold leading-snug line-clamp-2">{l.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{formatPrice(l.basePrice)} each</p>
                        </div>
                        <p className="text-sm font-bold shrink-0">{formatPrice(l.basePrice * l.qty)}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Price rows */}
                <div className="space-y-2 text-sm border-t border-border pt-4">
                  <Row label="Subtotal" value={formatPrice(subtotal)} />
                  {couponDiscount > 0 && <Row label={`Coupon (${applied!.code})`} value={`− ${formatPrice(couponDiscount)}`} accent />}
                  <Row label="Shipping" value={shipping === 0 ? "FREE" : formatPrice(shipping)} />
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-black">{formatPrice(total)}</span>
                </div>

                {globalErr && (
                  <p className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-600 flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {globalErr}
                  </p>
                )}

                <button
                  type="submit" disabled={placing || cartLoading}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a5c14] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#154a10] transition-colors disabled:opacity-60"
                >
                  {placing
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening Payment…</>
                    : <><Zap className="h-4 w-4" /> Pay {formatPrice(total)} Securely</>
                  }
                </button>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  🔒 256-bit encrypted · Powered by Razorpay
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", accent && "text-[#1a5c14]")}>{value}</span>
    </div>
  );
}
