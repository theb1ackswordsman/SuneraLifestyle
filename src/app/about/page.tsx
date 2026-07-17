import type { Metadata } from "next";
import Link from "next/link";
import { Leaf, FlaskConical, HeartHandshake, ShieldCheck, ArrowRight } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { Button } from "@/components/ui/button";
import { STOCK, img } from "@/data/mock/images";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `About Us — ${siteConfig.name}`,
  description: "Our mission is to bring the goodness of authentic Ayurveda to every Indian family — 100% natural, safe and effective.",
};

const STATS = [
  { value: "50K+", label: "Happy families" },
  { value: "100%", label: "Natural products" },
  { value: "4.8★", label: "Average rating" },
  { value: "120+", label: "Cities served" },
];

const VALUES = [
  { icon: Leaf, title: "100% Natural", text: "Pure herbs and time-tested Ayurvedic recipes — no chemicals, no artificial fillers." },
  { icon: FlaskConical, title: "Ayurvedic Formula", text: "Every product is rooted in classical Ayurveda and crafted for real, lasting wellness." },
  { icon: ShieldCheck, title: "Safe & Effective", text: "Made in a hygienic facility with quality checks, sealed and safe for the whole family." },
  { icon: HeartHandshake, title: "Family First", text: "From immunity to everyday care — wellness for every member of your home." },
];

export default function AboutPage() {
  return (
    <ShopLayout>
      {/* Hero */}
      <section className="relative flex min-h-[420px] items-end overflow-hidden pt-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img(STOCK.wellness.herbs, 1600)}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />
        <div className="container-padded relative z-10 pb-14 pt-20">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-orange-light">Our Story</p>
          <h1 className="max-w-2xl text-4xl font-black leading-tight text-white sm:text-5xl">
            Authentic Ayurveda for every Indian family.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            {siteConfig.name} brings the goodness of time-tested herbal wellness — 100% natural,
            safe and effective — to your everyday life. स्वस्थ जीवन, खुशहाल जीवन.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-muted/30">
        <div className="container-padded grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black text-brand-emerald sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="container-padded py-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(STOCK.wellness.tea, 1000)} alt="Ayurvedic herbs and tea" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-emerald">Why We Exist</p>
            <h2 className="text-3xl font-black tracking-tight">Nature has the answers.</h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                {siteConfig.name} began with a simple belief — that true wellness comes from nature. The market
                was full of chemical-heavy products with big claims, so we went back to the roots: pure herbs and
                authentic Ayurvedic recipes that families have trusted for generations.
              </p>
              <p>
                Today we craft our products in Surat, Gujarat with carefully sourced ingredients and strict quality
                checks — from Immunity Kadha and Detox Tea to Sanjivani Dravya — plus a handpicked range of women&apos;s
                ethnic wear. Natural, safe and made with care.
              </p>
            </div>
            <Link href="/shop" className="mt-7 inline-block">
              <Button variant="primary" size="lg">Explore Our Range <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-16">
        <div className="container-padded">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-emerald">What We Stand For</p>
            <h2 className="text-3xl font-black tracking-tight">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-background p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-emerald/10">
                  <Icon className="h-5 w-5 text-brand-emerald" />
                </div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-padded py-16">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#071f04] via-[#103a0c] to-[#1a5c14] px-8 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-black text-white sm:text-4xl">Ready to begin your wellness journey?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
            Join thousands of athletes who trust {siteConfig.name} to fuel their goals.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/shop"><Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">Shop Now</Button></Link>
            <Link href="/collections"><Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10">Browse Collections</Button></Link>
          </div>
        </div>
      </section>
    </ShopLayout>
  );
}
