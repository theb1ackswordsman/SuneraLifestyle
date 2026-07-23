import type { Metadata } from "next";
import { Mail, MapPin, Clock } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Contact Us — ${siteConfig.name}`,
  description: "Get in touch with SunEra Lifestyle. We're here to help with orders, products, and anything else.",
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const CONTACT_CARDS = [
  {
    icon: WhatsAppIcon,
    title: "WhatsApp",
    detail: "+91 91355 64607",
    sub: "Chat with us directly",
    href: "https://wa.me/919135564607",
    color: "text-[#25D366]",
    bg: "bg-[#25D366]/10",
  },
  {
    icon: Mail,
    title: "Email",
    detail: siteConfig.contact.email,
    sub: "We reply within 24 hours",
    href: `mailto:${siteConfig.contact.email}`,
    color: "text-brand-emerald",
    bg: "bg-brand-emerald/10",
  },
  {
    icon: MapPin,
    title: "Location",
    detail: "Surat, Gujarat",
    sub: "India — 395001",
    href: null,
    color: "text-brand-orange",
    bg: "bg-brand-orange/10",
  },
  {
    icon: Clock,
    title: "Support Hours",
    detail: "Mon – Sat",
    sub: "10:00 AM – 6:00 PM IST",
    href: null,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
];

export default function ContactPage() {
  return (
    <ShopLayout>
      <div className="pt-20 lg:pt-24">
        {/* Hero */}
        <div className="border-b border-border bg-muted/30 py-14">
          <div className="container-padded text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-emerald">
              Get In Touch
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Contact Us</h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Have a question about your order, our products, or anything else? We&apos;re happy to help.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="container-padded py-14">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CONTACT_CARDS.map(({ icon: Icon, title, detail, sub, href, color, bg }) => {
              const content = (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-background p-6 text-center transition-shadow hover:shadow-md">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
                  <p className="font-semibold text-foreground">{detail}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              );
              return href ? (
                <a key={title} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                  {content}
                </a>
              ) : (
                <div key={title}>{content}</div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="mt-12 rounded-3xl bg-linear-to-br from-[#071f04] via-[#103a0c] to-[#1a5c14] px-8 py-12 text-center">
            <h2 className="text-2xl font-black text-white sm:text-3xl">Fastest way to reach us</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-white/70">
              For order issues, shipping queries or product questions — WhatsApp is the quickest.
            </p>
            <a
              href="https://wa.me/919135564607"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-7 py-3 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
