import { HeroCarousel, type HeroSlide } from "./hero-carousel";

const HERO_SLIDES: HeroSlide[] = [
  {
    image: "/heroo1.png",
    badge: "🌿 Premium Ayurvedic Wellness & Ethnic Fashion",
    heading: "Live Healthy.\nDress Beautifully.",
    description:
      "Discover premium Ayurvedic supplements and elegant ethnic wear crafted to help you embrace a healthier lifestyle with timeless style.",
    primaryLabel: "Shop Supplements",
    primaryHref: "/shop?category=ayurvedic",
    secondaryLabel: "Shop Clothing",
    secondaryHref: "/shop?category=clothing",
  },
  {
    image: "/heroo2.png",
    badge: "✨ Premium Ethnic Collection",
    heading: "Timeless Elegance, Crafted for\nEvery Occasion.",
    description:
      "Discover beautifully crafted kurtis, suits, and ethnic wear designed for comfort, elegance, and effortless everyday style.",
    primaryLabel: "Shop Ethnic Wear",
    primaryHref: "/shop?category=clothing",
    secondaryLabel: "New Arrivals",
    secondaryHref: "/collections",
  },
  {
    image: "/heroo3.png",
    badge: "🌿 100% Ayurvedic Wellness",
    heading: "Nourish Your Body, Naturally.",
    description:
      "Premium herbal supplements crafted with trusted Ayurvedic ingredients to support your everyday wellness and healthy lifestyle.",
    primaryLabel: "Shop Supplements",
    primaryHref: "/shop?category=ayurvedic",
    textPosition: "center" as const,
  },
];

export function HeroBanner() {
  return <HeroCarousel slides={HERO_SLIDES} />;
}
