import type { Metadata } from "next";
import { ShopLayout } from "@/components/layout/shop-layout";
import { HeroBanner } from "@/components/home/hero-banner";
import { TrustBadges } from "@/components/home/trust-badges";
import { CategoryBanners } from "@/components/home/category-banners";
import { TabbedProducts } from "@/components/home/tabbed-products";
import { DualPromo } from "@/components/home/dual-promo";
import { Testimonials } from "@/components/home/testimonials";
import { Newsletter } from "@/components/home/newsletter";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
};

export default function HomePage() {
  return (
    <ShopLayout>
      <HeroBanner />
      <TrustBadges />
      <CategoryBanners />
      <TabbedProducts />
      <DualPromo />
      <Testimonials />
      <Newsletter />
    </ShopLayout>
  );
}
