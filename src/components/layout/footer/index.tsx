import Link from "next/link";
import { Instagram, Twitter, Youtube, Facebook } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/shared/logo";

const FOOTER_LINKS = {
  Shop: [
    { label: "All Products", href: "/shop" },
    { label: "Immunity & Kadha", href: "/shop?category=immunity" },
    { label: "Digestive Care", href: "/shop?category=digestive-care" },
    { label: "Weight Management", href: "/shop?category=weight-management" },
    { label: "Women's Care", href: "/shop?category=womens-care" },
    { label: "Kurtis & Suits", href: "/shop?category=kurtis" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Blogs", href: "/blogs" },
    { label: "Ambassadors", href: "/ambassadors" },
  ],
  Support: [
    { label: "Contact Us", href: "/contact" },
    { label: "Track Order", href: "/track-order" },
    { label: "FAQs", href: "/faqs" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
  ],
};

const SOCIAL_LINKS = [
  { icon: Instagram, label: "Instagram", href: siteConfig.social.instagram },
  { icon: Twitter, label: "Twitter", href: siteConfig.social.twitter },
  { icon: Youtube, label: "YouTube", href: siteConfig.social.youtube },
  { icon: Facebook, label: "Facebook", href: siteConfig.social.facebook },
];

const PAYMENT_METHODS = ["Visa", "Mastercard", "UPI", "Razorpay", "COD"];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      {/* Main footer */}
      <div className="container-padded py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="inline-block">
              <Logo height={48} />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {siteConfig.description}
            </p>
            {/* Social */}
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background transition-all hover:border-brand-emerald hover:text-brand-emerald hover:shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
            {/* App Download */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Download Our App
              </p>
              <div className="flex gap-2">
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold transition-colors hover:border-brand-emerald hover:text-brand-emerald"
                >
                  App Store
                </Link>
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold transition-colors hover:border-brand-emerald hover:text-brand-emerald"
                >
                  Play Store
                </Link>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
                {heading}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-brand-emerald"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-2xl border border-border bg-muted/30 p-6">
          {[
            { label: "Free Delivery", sub: "On orders above ₹999", emoji: "🚀" },
            { label: "100% Authentic", sub: "Certified products only", emoji: "✅" },
            { label: "Secure Payments", sub: "SSL encrypted checkout", emoji: "🔒" },
            { label: "Customer Support", sub: "Mon–Sat, 9am–6pm", emoji: "🎯" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-2xl">{item.emoji}</span>
              <div>
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Bottom bar */}
      <div className="container-padded py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-xs text-muted-foreground">We accept:</p>
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="text-[11px] font-semibold rounded border border-border px-2 py-0.5 text-muted-foreground"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
