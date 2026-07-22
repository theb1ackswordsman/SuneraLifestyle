import Link from "next/link";
import { cn } from "@/lib/utils";
import { STOCK, img } from "@/data/mock/images";

interface Banner {
  label?: string;
  badge?: string;
  badgeColor?: string;
  heading: string;
  sub?: string;
  href: string;
  bg: string;
  image?: string;
  large?: boolean;
  wide?: boolean;
}

const BANNERS: Banner[] = [
  {
    badge: "Ethnic Wear",
    badgeColor: "bg-brand-emerald",
    heading: "KURTIS &\nSUIT SETS",
    sub: "Up to 40% Off",
    href: "/shop?category=kurtis",
    bg: "from-fuchsia-600 via-purple-700 to-purple-950",
    image: img(STOCK.ethnic.kurti, 1000),
    large: true,
  },
  {
    badge: "Bestseller",
    badgeColor: "bg-red-500",
    heading: "IMMUNITY\nKADHA",
    href: "/shop?category=immunity",
    bg: "from-[#2d8a22] via-[#1a5c14] to-[#071f04]",
    image: "/immunityy.jpg",
  },
  {
    badge: "25% OFF",
    badgeColor: "bg-red-500",
    heading: "SLIM FIT\nPOWDER",
    href: "/shop?category=weight-management",
    bg: "from-emerald-600 via-emerald-800 to-emerald-950",
    image: img(STOCK.wellness.powder),
  },
  {
    label: "Digestive Care",
    heading: "Churna &\nDetox Tea",
    sub: "Min. 30–50% Off",
    href: "/shop?category=digestive-care",
    bg: "from-amber-600 via-orange-700 to-orange-950",
    image: "/detox.jpg",
    wide: true,
  },
];

function BannerCard({ b, className }: { b: Banner; className?: string }) {
  return (
    <Link
      href={b.href}
      className={cn("group relative block overflow-hidden rounded-lg", className)}
    >
      {/* bg gradient (fallback / tint base) */}
      <div className={cn("absolute inset-0 bg-linear-to-br transition-transform duration-500 group-hover:scale-105", b.bg)} />
      {/* bg image */}
      {b.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={b.image}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/40 transition-opacity duration-300 group-hover:bg-black/50" />

      {/* badge/label */}
      <div className="absolute left-4 top-4">
        {b.badge && (
          <span className={cn("px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white", b.badgeColor)}>
            {b.badge}
          </span>
        )}
        {b.label && (
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
            {b.label}
          </span>
        )}
      </div>

      {/* text */}
      <div className="absolute bottom-6 left-5 right-5">
        <h3 className={cn("whitespace-pre-line font-black leading-tight text-white", b.large ? "text-3xl lg:text-4xl" : b.wide ? "text-2xl" : "text-xl")}>
          {b.heading}
        </h3>
        {b.sub && <p className="mt-1 text-sm text-white/70">{b.sub}</p>}
        <span className="mt-3 inline-flex items-center gap-1 border border-white/60 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-colors group-hover:bg-white group-hover:text-gray-900">
          Shop Now
        </span>
      </div>
    </Link>
  );
}

export function CategoryBanners() {
  const [large, ...rest] = BANNERS;
  const smalls = rest.slice(0, 2);
  const wide   = rest[2];

  return (
    <section className="container-padded py-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
        {/* Large left — spans 2 rows on desktop */}
        <BannerCard b={large} className="min-h-70 sm:min-h-80 sm:row-span-2 lg:row-span-2 lg:min-h-0" />

        {/* Two small top-right */}
        {smalls.map((b) => (
          <BannerCard key={b.href} b={b} className="min-h-45 sm:min-h-50" />
        ))}

        {/* Wide bottom-right — spans 2 cols */}
        <BannerCard b={wide} className="min-h-45 sm:col-span-2 sm:min-h-50 lg:col-span-2" />
      </div>
    </section>
  );
}
