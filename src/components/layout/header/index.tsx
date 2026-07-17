"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingBag, Heart, User, Menu, X,
  ChevronDown, ArrowRight, LogOut, Package, MapPin, Settings,
  Mail, Phone,
} from "lucide-react";
import { useScrolled } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { NAV_CATEGORIES } from "@/data/mock/homepage";
import { siteConfig } from "@/config/site";

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

// ─── Mega Menu ────────────────────────────────────────────────────────────────
function MegaMenu({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3"
        >
          <div className="w-170 overflow-hidden rounded-2xl border border-border bg-background shadow-elevated">
            <div className="grid grid-cols-3 gap-px bg-border">
              <div className="col-span-2 bg-background p-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Categories
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {NAV_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-foreground group-hover:text-brand-emerald transition-colors">
                        {cat.label}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 border-t border-border pt-4">
                  <Link
                    href={ROUTES.SHOP}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-emerald hover:gap-3 transition-all"
                  >
                    View All Products <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-4 bg-muted/50 p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Featured
                </p>
                <div className="flex flex-1 items-end overflow-hidden rounded-xl bg-linear-to-br from-[#1a5c14] to-[#071f04] p-4">
                  <div className="text-white">
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Bestseller</p>
                    <p className="mt-1 font-bold leading-tight">Immunity Kadha</p>
                    <Link
                      href="/product/sunera-immunity-kadha"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#f5a823] hover:text-white transition-colors"
                    >
                      Shop Now <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── User Dropdown ────────────────────────────────────────────────────────────
function UserDropdown({ isOpen }: { isOpen: boolean }) {
  const isLoggedIn = false;

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
            {isLoggedIn ? (
              <>
                <div className="border-b border-border p-4">
                  <p className="text-sm font-semibold">Welcome back!</p>
                  <p className="text-xs text-muted-foreground">user@example.com</p>
                </div>
                <div className="p-1.5">
                  {[
                    { icon: Package, label: "My Orders",  href: "/account/orders"    },
                    { icon: Heart,   label: "Wishlist",   href: ROUTES.WISHLIST       },
                    { icon: MapPin,  label: "Addresses",  href: "/account/addresses" },
                    { icon: Settings,label: "Settings",   href: "/account/settings"  },
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
                </div>
                <div className="border-t border-border p-1.5">
                  <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
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

// ─── Search Overlay ───────────────────────────────────────────────────────────
function SearchOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) setTimeout(() => inputRef.current?.focus(), 100);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 bg-background/95 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div className="container-padded pb-8 pt-24">
            <div className="mx-auto max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="search"
                  placeholder="Search products, categories…"
                  className="h-14 w-full rounded-2xl border border-border bg-background pl-12 pr-14 text-base outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20"
                />
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-colors hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">Esc</kbd> to close
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

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
                        <button
                          onClick={() => setShopOpen((p) => !p)}
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
                              {NAV_CATEGORIES.map((cat) => (
                                <li key={cat.href}>
                                  <Link
                                    href={cat.href}
                                    onClick={onClose}
                                    className="flex items-center gap-3 rounded-xl px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                  >
                                    <span>{cat.emoji}</span>
                                    {cat.label}
                                  </Link>
                                </li>
                              ))}
                              <li>
                                <Link
                                  href={ROUTES.SHOP}
                                  onClick={onClose}
                                  className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-brand-emerald transition-colors hover:bg-muted"
                                >
                                  View All <ArrowRight className="h-3.5 w-3.5" />
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
  const pathname       = usePathname();
  const scrolled       = useScrolled(10);
  const announcementHidden = useScrolled(40);
  const [megaMenuOpen, setMegaMenuOpen]  = useState(false);
  const [userMenuOpen, setUserMenuOpen]  = useState(false);
  const [searchOpen,   setSearchOpen]    = useState(false);
  const [mobileOpen,   setMobileOpen]    = useState(false);
  const megaTimer = useRef<NodeJS.Timeout>(null);
  const userTimer = useRef<NodeJS.Timeout>(null);
  const cartCount = 0;

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
        {/* Announcement bar */}
        <AnnouncementBar visible={!announcementHidden} />

        {/* Main nav */}
        <div className={cn("transition-colors duration-300", navBg)}>
          <div className="container-padded">
            <div className="flex h-15 items-center justify-between gap-4 lg:h-16">

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 text-foreground" />
              </button>

              {/* Logo */}
              <Link href={ROUTES.HOME} className="shrink-0">
                <Logo height={40} />
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
                      <button
                        className={cn(
                          "flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                          "text-foreground/70 hover:text-foreground hover:bg-muted",
                          megaMenuOpen && "text-foreground bg-muted"
                        )}
                      >
                        {link.label}
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", megaMenuOpen && "rotate-180")} />
                      </button>
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
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Search className="h-4.5 w-4.5" />
                </button>

                <Link
                  href={ROUTES.WISHLIST}
                  aria-label="Wishlist"
                  className="hidden h-9 w-9 items-center justify-center rounded-xl text-foreground/70 transition-colors hover:bg-muted hover:text-foreground sm:flex"
                >
                  <Heart className="h-4.5 w-4.5" />
                </Link>

                <Link
                  href={ROUTES.CART}
                  aria-label={`Cart (${cartCount} items)`}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ShoppingBag className="h-4.5 w-4.5" />
                  {cartCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-emerald text-[10px] font-bold text-white">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Link>

                <div className="relative hidden sm:block" onMouseEnter={openUser} onMouseLeave={closeUser}>
                  <button
                    aria-label="Account"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <User className="h-4.5 w-4.5" />
                  </button>
                  <UserDropdown isOpen={userMenuOpen} />
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
