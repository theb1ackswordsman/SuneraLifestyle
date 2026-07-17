import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { STOCK, img } from "@/data/mock/images";

const PROMOS = [
  {
    eyebrow: "Family Wellness",
    heading: "SANJIVANI\nDRAVYA",
    highlight: "Flat 30% Off",
    cta: "Shop Now",
    href: "/shop?category=ayurvedic-medicine",
    bg: "from-[#071f04] via-[#103a0c] to-[#1a5c14]",
    image: img(STOCK.wellness.dropper, 1000),
    emoji: "💧",
  },
  {
    eyebrow: "New Collection",
    heading: "FESTIVE\nSUIT SETS",
    highlight: "Min. 20–40% Off",
    cta: "Shop Now",
    href: "/shop?category=suits",
    bg: "from-rose-700 via-rose-800 to-red-950",
    image: img(STOCK.ethnic.saree, 1000),
    emoji: "👗",
  },
];

export function DualPromo() {
  return (
    <section className="container-padded py-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {PROMOS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group relative block min-h-[260px] overflow-hidden rounded-lg"
          >
            {/* bg */}
            <div className={cn("absolute inset-0 bg-linear-to-br transition-transform duration-500 group-hover:scale-105", p.bg)} />
            {p.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-overlay transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />

            {/* emoji decoration */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[100px] leading-none opacity-20 select-none">
              {p.emoji}
            </div>

            {/* content */}
            <div className="relative z-10 flex h-full flex-col justify-center p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                {p.eyebrow}
              </p>
              <h3 className="mt-2 whitespace-pre-line text-3xl font-black leading-tight text-white">
                {p.heading}
              </h3>
              <p className="mt-2 text-lg font-bold text-[#f5a823]">{p.highlight}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white group-hover:gap-3 transition-all">
                {p.cta} <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
