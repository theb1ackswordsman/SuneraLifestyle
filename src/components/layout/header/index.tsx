"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingBag, Heart, User, Menu, X,
  ChevronDown, ChevronRight, ArrowRight, LogOut, Package, MapPin, Settings,
  Mail, Phone, RotateCcw, Loader2, Tag, TrendingUp, Clock, Trash2,
} from "lucide-react";
import { useScrolled } from "@/hooks/use-scroll";
import { useCartCount } from "@/hooks/use-cart-count";
import { useWishlistCount } from "@/hooks/use-wishlist-count";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/config/site";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavSub      { _id: string; name: string; href: string }
interface NavCategory { _id: string; name: string; href: string; subcategories: NavSub[] }

// Module-level cache — avoids refetch on every client navigation
let _navCache: NavCategory[] | null = null;
async function fetchNavCategories(): Promise<NavCategory[]> {
  if (_navCache) return _navCache;
  try {
    const res  = await fetch("/api/categories/nav");
    const json = await res.json();
    _navCache  = json.data ?? [];
    return _navCache!;
  } catch {
    return [];
  }
}

// ─── Nav Links ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Home",        href: ROUTES.HOME },
  { label: "Shop",        href: ROUTES.SHOP, hasMegaMenu: true },
  { label: "Collections", href: "/collections" },
  { label: "About",       href: "/about" },
  { label: "Blogs",       href: "/blogs" },
];

// ─── Announcement Bar ─────────────────────────────────────────────────────────
function AnnouncementBar({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300 bg-[#1a5c14]",
        visible ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
      )}
    >
      <div className="container-padded flex items-center justify-between gap-4 py-1.5 text-[11px] text-white/90">
        <div className="hidden items-center gap-4 sm:flex">
          <span className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" /> {siteConfig.contact.email}
          </span>
          <span className="text-white/40">|</span>
          <span className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" /> {siteConfig.contact.phone}
          </span>
        </div>
        <p className="font-semibold text-center flex-1 sm:flex-none">
          🚀 Free Shipping on all orders above ₹999!
        </p>
        <span className="hidden sm:block text-white/70">🇮🇳 India&nbsp;|&nbsp;₹&nbsp;INR</span>
      </div>
    </div>
  );
}

// ─── Mega Menu (two-level: category → subcategories on hover) ────────────────
function MegaMenu({ visible }: { visible: boolean }) {
  const [navCats,   setNavCats]   = useState<NavCategory[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const active = activeIdx !== null ? navCats[activeIdx] : null;

  useEffect(() => {
    fetchNavCategories().then(setNavCats);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3"
          onMouseLeave={() => setActiveIdx(null)}
        >
          <div className="flex overflow-hidden rounded-2xl border border-border bg-background shadow-elevated">
            {/* Left — top-level categories */}
            <div className="w-55 shrink-0 p-3">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Shop by Type
              </p>
              {navCats.map((cat, i) => (
                <Link
                  key={cat._id}
                  href={cat.href}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                    activeIdx === i ? "bg-muted text-brand-emerald" : "text-foreground hover:bg-muted/60"
                  )}
                >
                  {cat.name}
                  <ChevronRight className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    activeIdx === i ? "text-brand-emerald" : "text-muted-foreground"
                  )} />
                </Link>
              ))}
              <div className="mt-3 border-t border-border pt-3 px-1">
                <Link
                  href={ROUTES.SHOP}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-brand-emerald transition-colors hover:bg-muted"
                >
                  View All Products <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Right — subcategories, only when a category is hovered */}
            <AnimatePresence>
              {active && active.subcategories.length > 0 && (
                <motion.div
                  key={active._id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.14 }}
                  className="w-60 border-l border-border p-4"
                >
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {active.name}
                  </p>
                  <div className="space-y-0.5">
                    {active.subcategories.map((sub) => (
                      <Link
                        key={sub._id}
                        href={sub.href}
                        className="block rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-brand-emerald"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-border pt-3">
                    <Link
                      href={active.href}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-emerald transition-all hover:gap-2.5"
                    >
                      Browse all <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Current user ─────────────────────────────────────────────────────────────
interface SessionUser { name: string; email: string; role: string }

function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => { if (json.success) setUser(json.data); })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  return { user, checked };
}

// ─── User Dropdown ────────────────────────────────────────────────────────────
function UserDropdown({ isOpen, user, onLogout }: {
  isOpen: boolean;
  user: SessionUser | null;
  onLogout: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full z-50 mt-2 w-56"
        >
          <div className="overflow-hidden rounded-xl border border-border bg-background shadow-elevated">
            {user ? (
              <>
                <div className="border-b border-border p-4">
                  <p className="text-sm font-semibold">{user.name ?? "Welcome back!"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {user.role === "admin" && (
                    <span className="mt-1 inline-block rounded-full bg-[#1a5c14]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1a5c14]">
                      Admin
                    </span>
                  )}
                </div>
                <div className="p-1.5">
                  {user.role === "admin" ? (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Admin Panel
                    </Link>
                  ) : (
                    <>
                      {[
                        { icon: Package,    label: "My Orders",   href: "/account/orders"   },
                        { icon: RotateCcw, label: "My Returns",  href: "/account/returns"  },
                        { icon: Heart,     label: "Wishlist",    href: ROUTES.WISHLIST      },
                        { icon: MapPin,    label: "Addresses",   href: "/account/addresses" },
                        { icon: Settings,  label: "Settings",    href: "/account/profile"  },
                      ].map(({ icon: Icon, label, href }) => (
                        <Link
                          key={href}
                          href={href}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {label}
                        </Link>
                      ))}
                    </>
                  )}
                </div>
                <div className="border-t border-border p-1.5">
                  <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2 p-3">
                <Link href={ROUTES.LOGIN} className="block">
                  <Button variant="default" size="sm" className="w-full">Sign In</Button>
                </Link>
                <Link href={ROUTES.REGISTER} className="block">
                  <Button variant="outline" size="sm" className="w-full">Create Account</Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── WhatsApp Icon ────────────────────────────────────────────────────────────
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const WA_LINK = "https://wa.me/919135564607";

// ─── Search Overlay ───────────────────────────────────────────────────────────
interface SearchResult {
  _id: string; name: string; slug: string;
  basePrice: number; compareAtPrice?: number;
  images: string[];
  category?: { name: string; slug: string };
}

function highlight(text: string, q: string): React.ReactNode {
  if (!q.trim()) return text;
  const safe  = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safe})`, "gi"));
  return parts.map((p, i) =>
    new RegExp(safe, "i").test(p)
      ? <mark key={i} className="bg-amber-100 text-amber-900 not-italic font-semibold">{p}</mark>
      : p
  );
}

function SearchOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query,             setQuery]             = useState("");
  const [results,           setResults]           = useState<SearchResult[]>([]);
  const [keywords,          setKeywords]          = useState<string[]>([]);
  const [trending,          setTrending]          = useState<string[]>([]);
  const [popularCategories, setPopularCategories] = useState<{ name: string; slug: string }[]>([]);
  const [recentSearches,    setRecentSearches]    = useState<string[]>([]);
  const [loading,           setLoading]           = useState(false);
  const [focused,           setFocused]           = useState(-1);
  const [trendingLoaded,    setTrendingLoaded]    = useState(false);

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (!trendingLoaded) {
        fetch("/api/search/trending")
          .then((r) => r.json())
          .then((json) => {
            if (json.success) {
              setTrending(json.data?.trending ?? []);
              setPopularCategories(json.data?.categories ?? []);
              setTrendingLoaded(true);
            }
          }).catch(() => {});
      }
      fetch("/api/search/recent")
        .then((r) => { if (r.status === 401) return null; return r.json(); })
        .then((json) => { if (json?.success) setRecentSearches(json.data?.queries ?? []); })
        .catch(() => {});
    } else {
      setQuery(""); setResults([]); setKeywords([]); setFocused(-1);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const search = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); setKeywords([]); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/search/suggest?q=${encodeURIComponent(q.trim())}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data?.products ?? []);
          setKeywords(json.data?.keywords ?? []);
        }
      } catch { setResults([]); setKeywords([]); }
      finally { setLoading(false); }
    }, 280);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value); setFocused(-1); search(e.target.value);
  }

  function goToSearch(q: string) {
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    fetch("/api/search/recent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: q.trim() }) }).catch(() => {});
    onClose();
  }

  function goToProduct(slug: string, position: number) {
    const result = results.find((r) => r.slug === slug);
    fetch("/api/search/click", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, productId: result?._id, slug, position }) }).catch(() => {});
    router.push(`/product/${slug}`);
    onClose();
  }

  function clearRecent(q?: string) {
    if (q) {
      fetch("/api/search/recent", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q }) }).catch(() => {});
      setRecentSearches((prev) => prev.filter((r) => r !== q));
    } else {
      fetch("/api/search/recent", { method: "DELETE" }).catch(() => {});
      setRecentSearches([]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const total = results.length + keywords.length;
    if (e.key === "ArrowDown")  { e.preventDefault(); setFocused((p) => Math.min(p + 1, total - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocused((p) => Math.max(p - 1, -1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (focused >= 0 && focused < results.length) goToProduct(results[focused].slug, focused);
      else if (focused >= results.length && focused < total) goToSearch(keywords[focused - results.length]);
      else if (query.trim()) goToSearch(query);
    } else if (e.key === "Escape") onClose();
  }

  const hasQuery = query.trim().length > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="fixed inset-0 z-100 bg-black/50 backdrop-blur-xl"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div className="container-padded pb-8 pt-20">
            <div className="mx-auto max-w-2xl">

              {/* Input */}
              <div className="relative">
                {loading
                  ? <Loader2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1a5c14] animate-spin" />
                  : <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                }
                <input
                  ref={inputRef} type="text" value={query}
                  onChange={handleChange} onKeyDown={handleKeyDown}
                  placeholder="Search products, categories…"
                  autoComplete="off" autoCorrect="off" spellCheck={false}
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-20 text-base focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 outline-none shadow-lg transition-shadow"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {query && (
                    <button onClick={() => { setQuery(""); setResults([]); setKeywords([]); inputRef.current?.focus(); }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* IDLE STATE */}
              {!hasQuery && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className="mt-3 overflow-hidden rounded-2xl bg-white shadow-2xl">

                  {recentSearches.length > 0 && (
                    <>
                      <div className="px-4 pt-4 pb-3">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            <Clock className="h-3.5 w-3.5" /> Recent Searches
                          </span>
                          <button onClick={() => clearRecent()} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3 w-3" /> Clear all
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.slice(0, 8).map((r) => (
                            <div key={r} className="group flex items-center gap-1">
                              <button onClick={() => goToSearch(r)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm hover:border-[#1a5c14]/40 hover:bg-[#1a5c14]/5 transition-colors">
                                <Clock className="h-3 w-3 text-gray-400" /> {r}
                              </button>
                              <button onClick={() => clearRecent(r)}
                                className="hidden group-hover:flex items-center justify-center h-5 w-5 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mx-4 border-t border-gray-100" />
                    </>
                  )}

                  <div className="px-4 py-3">
                    <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <TrendingUp className="h-3.5 w-3.5" /> Trending Searches
                    </p>
                    {trending.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {trending.slice(0, 10).map((t, i) => (
                          <button key={t} onClick={() => goToSearch(t)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm hover:border-[#1a5c14]/40 hover:bg-[#1a5c14]/5 transition-colors">
                            <span className="text-[10px] font-bold text-[#1a5c14]">{i + 1}</span> {t}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-2">{[1,2,3,4].map((n) => <div key={n} className="h-7 w-20 animate-pulse rounded-full bg-gray-100" />)}</div>
                    )}
                  </div>

                  {popularCategories.length > 0 && (
                    <>
                      <div className="mx-4 border-t border-gray-100" />
                      <div className="px-4 py-3 pb-4">
                        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          <Tag className="h-3.5 w-3.5" /> Browse Categories
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {popularCategories.map((cat) => (
                            <Link key={cat.slug} href={`/shop?category=${cat.slug}`} onClick={onClose}
                              className="rounded-full bg-gray-100 px-3 py-1 text-sm hover:bg-[#1a5c14]/10 hover:text-[#1a5c14] transition-colors">
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* RESULTS STATE */}
              {hasQuery && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.14 }}
                  className="mt-3 overflow-hidden rounded-2xl bg-white shadow-2xl">

                  {keywords.length > 0 && (
                    <>
                      <div className="divide-y divide-gray-50">
                        {keywords.slice(0, 5).map((kw, i) => {
                          const kwIdx = results.length + i;
                          return (
                            <button key={kw} onClick={() => goToSearch(kw)}
                              className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                                focused === kwIdx ? "bg-[#1a5c14]/10" : "hover:bg-[#1a5c14]/5")}>
                              <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                              <span className="truncate">{highlight(kw, query)}</span>
                            </button>
                          );
                        })}
                      </div>
                      {results.length > 0 && <div className="mx-4 border-t border-gray-100" />}
                    </>
                  )}

                  {results.length > 0 && (
                    <>
                      <div className="px-4 pt-3 pb-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Products</p>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {results.slice(0, 6).map((item, i) => (
                          <button key={item._id} onClick={() => goToProduct(item.slug, i)}
                            className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                              focused === i ? "bg-gray-50" : "hover:bg-gray-50/80")}>
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                              {item.images[0]
                                ? <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" />
                                : <div className="flex h-full w-full items-center justify-center"><Package className="h-5 w-5 text-gray-300" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">{highlight(item.name, query)}</p>
                              {item.category?.name && (
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                                  <Tag className="h-3 w-3" /> {item.category.name}
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-bold text-gray-900">₹{item.basePrice.toLocaleString("en-IN")}</p>
                              {item.compareAtPrice && item.compareAtPrice > item.basePrice && (
                                <p className="text-xs text-gray-400 line-through">₹{item.compareAtPrice.toLocaleString("en-IN")}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {loading && results.length === 0 && keywords.length === 0 && (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-[#1a5c14]" />
                    </div>
                  )}

                  {!loading && results.length === 0 && keywords.length === 0 && (
                    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                      <Search className="h-8 w-8 text-gray-200" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">No results for &ldquo;{query}&rdquo;</p>
                        <p className="mt-0.5 text-xs text-gray-400">Try a different spelling or keyword</p>
                      </div>
                      {trending.length > 0 && (
                        <div className="mt-1">
                          <p className="mb-2 text-xs text-gray-400">Try:</p>
                          <div className="flex flex-wrap justify-center gap-1.5">
                            {trending.slice(0, 5).map((t) => (
                              <button key={t} onClick={() => goToSearch(t)}
                                className="rounded-full bg-gray-100 px-3 py-1 text-xs hover:bg-[#1a5c14]/10 hover:text-[#1a5c14] transition-colors">
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!loading && (results.length > 0 || keywords.length > 0) && (
                    <button onClick={() => goToSearch(query)}
                      className="flex w-full items-center justify-between border-t border-gray-100 bg-[#1a5c14]/5 px-4 py-3 text-sm font-semibold text-[#1a5c14] transition-colors hover:bg-[#1a5c14]/10">
                      <span>See all results for &ldquo;{query}&rdquo;</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </motion.div>
              )}


            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [shopOpen,  setShopOpen]  = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [navCats,   setNavCats]   = useState<NavCategory[]>([]);

  useEffect(() => {
    fetchNavCategories().then(setNavCats);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function toggleCategory(i: number) {
    setActiveIdx((prev) => (prev === i ? null : i));
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[320px] max-w-[85vw] flex-col bg-background shadow-elevated"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Link href={ROUTES.HOME} onClick={onClose}>
                <Logo height={36} />
              </Link>
              <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    {link.hasMegaMenu ? (
                      <>
                        {/* Shop toggle */}
                        <button
                          onClick={() => { setShopOpen((p) => !p); setActiveIdx(null); }}
                          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
                        >
                          {link.label}
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", shopOpen && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                          {shopOpen && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              {/* Top-level categories */}
                              {navCats.map((cat, i) => (
                                <li key={cat._id}>
                                  <div className="flex items-center rounded-xl hover:bg-muted transition-colors">
                                    <Link
                                      href={cat.href}
                                      onClick={onClose}
                                      className="flex-1 px-6 py-2.5 text-sm font-semibold text-foreground"
                                    >
                                      {cat.name}
                                    </Link>
                                    {cat.subcategories.length > 0 && (
                                      <button
                                        onClick={() => toggleCategory(i)}
                                        className="px-3 py-2.5"
                                        aria-label={`Expand ${cat.name}`}
                                      >
                                        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", activeIdx === i && "rotate-180")} />
                                      </button>
                                    )}
                                  </div>

                                  {/* Subcategories */}
                                  <AnimatePresence>
                                    {activeIdx === i && cat.subcategories.length > 0 && (
                                      <motion.ul
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        {cat.subcategories.map((sub) => (
                                          <li key={sub._id}>
                                            <Link
                                              href={sub.href}
                                              onClick={onClose}
                                              className="block rounded-xl py-2 pl-10 pr-4 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                            >
                                              {sub.name}
                                            </Link>
                                          </li>
                                        ))}
                                        <li>
                                          <Link
                                            href={cat.href}
                                            onClick={onClose}
                                            className="flex items-center gap-1.5 rounded-xl py-2 pl-12 pr-4 text-xs font-semibold text-brand-emerald transition-colors hover:bg-muted"
                                          >
                                            Browse all {cat.name} <ArrowRight className="h-3 w-3" />
                                          </Link>
                                        </li>
                                      </motion.ul>
                                    )}
                                  </AnimatePresence>
                                </li>
                              ))}

                              <li>
                                <Link
                                  href={ROUTES.SHOP}
                                  onClick={onClose}
                                  className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-brand-emerald transition-colors hover:bg-muted"
                                >
                                  View All Products <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              </li>
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className="flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-2 border-t border-border pt-4">
                <Link href={ROUTES.WISHLIST} onClick={onClose} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted">
                  <Heart className="h-4 w-4 text-muted-foreground" /> Wishlist
                </Link>
                <Link href={ROUTES.ACCOUNT} onClick={onClose} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" /> My Account
                </Link>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#25D366] transition-colors hover:bg-muted"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
                </a>
              </div>
            </nav>

            {/* CTA */}
            <div className="space-y-2 border-t border-border p-4">
              <Link href={ROUTES.LOGIN} onClick={onClose} className="block">
                <Button variant="default" className="w-full">Sign In</Button>
              </Link>
              <Link href={ROUTES.REGISTER} onClick={onClose} className="block">
                <Button variant="outline" className="w-full">Create Account</Button>
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Header ─────────────────────────────────────────────────────────────
export function Header() {
  const pathname           = usePathname();
  const scrolled           = useScrolled(10);
  const announcementHidden = useScrolled(40);
  const { user }           = useSession();
  const cartCount          = useCartCount();
  const wishlistCount      = useWishlistCount();
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const megaTimer = useRef<NodeJS.Timeout>(null);
  const userTimer = useRef<NodeJS.Timeout>(null);

  // Where the Account icon points depends on role
  const accountHref = !user
    ? ROUTES.LOGIN
    : user.role === "admin"
    ? "/admin"
    : ROUTES.ACCOUNT;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = ROUTES.LOGIN;
  }

  function openMega()  { if (megaTimer.current) clearTimeout(megaTimer.current); setMegaMenuOpen(true); }
  function closeMega() { megaTimer.current = setTimeout(() => setMegaMenuOpen(false), 150); }
  function openUser()  { if (userTimer.current) clearTimeout(userTimer.current); setUserMenuOpen(true); }
  function closeUser() { userTimer.current = setTimeout(() => setUserMenuOpen(false), 200); }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setSearchOpen(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const navBg = scrolled
    ? "bg-background/95 backdrop-blur-md shadow-sm"
    : "bg-background";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border transition-shadow duration-300">
        <AnnouncementBar visible={!announcementHidden} />

        <div className={cn("transition-colors duration-300", navBg)}>
          <div className="container-padded">
            <div className="relative flex h-15 items-center justify-between gap-4 lg:h-16">

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 text-foreground" />
              </button>

              {/* Logo — absolutely centered on mobile, static on desktop */}
              <Link href={ROUTES.HOME} className="absolute left-1/2 -translate-x-1/2 shrink-0 lg:static lg:translate-x-0">
                <Logo height={56} />
              </Link>

              {/* Desktop nav */}
              <nav className="hidden items-center gap-1 lg:flex">
                {NAV_LINKS.map((link) =>
                  link.hasMegaMenu ? (
                    <div
                      key={link.href}
                      className="relative"
                      onMouseEnter={openMega}
                      onMouseLeave={closeMega}
                    >
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                          "text-foreground/70 hover:text-foreground hover:bg-muted",
                          (megaMenuOpen || pathname === link.href) && "text-foreground bg-muted"
                        )}
                      >
                        {link.label}
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", megaMenuOpen && "rotate-180")} />
                      </Link>
                      <MegaMenu visible={megaMenuOpen} />
                    </div>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                        pathname === link.href
                          ? "bg-muted text-foreground"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {link.label}
                    </Link>
                  )
                )}
              </nav>

              {/* Action icons */}
              <div className="flex items-center gap-1">
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat on WhatsApp"
                  className="hidden flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-foreground/70 transition-colors hover:bg-muted hover:text-[#25D366] sm:flex"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  <span className="text-[10px] font-semibold leading-none">WhatsApp</span>
                </a>

                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  className="flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Search className="h-5 w-5" />
                  <span className="text-[10px] font-semibold leading-none">Search</span>
                </button>

                <Link
                  href={ROUTES.WISHLIST}
                  aria-label={`Wishlist (${wishlistCount} items)`}
                  className="hidden flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground sm:flex"
                >
                  <span className="relative">
                    <Heart className="h-5 w-5" />
                    {wishlistCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                        {wishlistCount > 9 ? "9+" : wishlistCount}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-semibold leading-none">Wishlist</span>
                </Link>

                <Link
                  href={ROUTES.CART}
                  aria-label={`Cart (${cartCount} items)`}
                  className="relative flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <span className="relative">
                    <ShoppingBag className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-emerald text-[10px] font-bold text-white">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-semibold leading-none">Cart</span>
                </Link>

                <div
                  className="relative hidden sm:block"
                  onMouseEnter={openUser}
                  onMouseLeave={closeUser}
                >
                  <Link
                    href={accountHref}
                    aria-label="Account"
                    className="flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-[10px] font-semibold leading-none">
                      {user ? (user.role === "admin" ? "Admin" : "Account") : "Account"}
                    </span>
                  </Link>
                  <UserDropdown isOpen={userMenuOpen} user={user} onLogout={handleLogout} />
                </div>
              </div>

            </div>
          </div>
        </div>
      </header>

      <SearchOverlay visible={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
