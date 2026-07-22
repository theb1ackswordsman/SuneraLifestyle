import type { Metadata } from "next";
import { ShopLayout } from "@/components/layout/shop-layout";
import { HeroBanner } from "@/components/home/hero-banner";
import { TrustBadges } from "@/components/home/trust-badges";
import { CategoryBanners } from "@/components/home/category-banners";
import { TabbedProducts } from "@/components/home/tabbed-products";
import { DualPromo } from "@/components/home/dual-promo";
import { Testimonials } from "@/components/home/testimonials";
import { CategoryProductsSections } from "@/components/home/category-products-section";
import { queryFeaturedSections } from "@/lib/shop/query-featured-by-type";
import { queryTabbedProducts } from "@/lib/shop/query-tabbed-products";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
};

export default async function HomePage() {
  const [featuredSections, tabbedSets] = await Promise.all([
    queryFeaturedSections(10).catch(() => []),
    queryTabbedProducts(5).catch(() => ({ newArrivals: [], bestSellers: [], topRated: [] })),
  ]);

  return (
    <ShopLayout>
      <HeroBanner />
      <TrustBadges />
      <CategoryBanners />
      <TabbedProducts sets={tabbedSets} />
      <CategoryProductsSections sections={featuredSections} />
      <DualPromo />
      <Testimonials />
    </ShopLayout>
  );
}
