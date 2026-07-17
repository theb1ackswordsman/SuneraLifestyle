import { connectDB } from "@/lib/db/connection";
import { HeroBanner as HeroBannerModel } from "@/models/hero-banner.model";
import { HERO_SLIDES } from "@/data/mock/homepage";
import { HeroCarousel, type HeroSlide } from "./hero-carousel";

export async function HeroBanner() {
  let slides: HeroSlide[] = [];

  try {
    await connectDB();
    const docs = await HeroBannerModel.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    slides = docs.map((d) => ({
      _id: d._id?.toString(),
      eyebrow: d.eyebrow,
      headline: d.headline,
      discount: d.discount,
      sub: d.sub,
      ctaLabel: d.ctaLabel,
      ctaHref: d.ctaHref,
      secondaryLabel: d.secondaryLabel,
      secondaryHref: d.secondaryHref,
      image: d.image,
      bg: d.bg,
      accentColor: d.accentColor,
    }));
  } catch {
    // DB unavailable — static fallback below
  }

  if (!slides.length) {
    slides = HERO_SLIDES as HeroSlide[];
  }

  return <HeroCarousel slides={slides} />;
}
