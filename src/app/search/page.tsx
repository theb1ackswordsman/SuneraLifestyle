import type { Metadata } from "next";
import { ShopLayout } from "@/components/layout/shop-layout";
import { SearchContent } from "./_content";
import { siteConfig } from "@/config/site";

interface Props { searchParams: Promise<Record<string, string>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams;
  const q = p.q?.trim();
  return {
    title: q ? `Search: "${q}" — ${siteConfig.name}` : `Search — ${siteConfig.name}`,
    description: q
      ? `Browse search results for "${q}" on ${siteConfig.name}. Find Ayurvedic wellness products and ethnic wear.`
      : `Search the ${siteConfig.name} catalogue for Ayurvedic wellness products, herbal supplements and ethnic wear.`,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const p = await searchParams;
  return (
    <ShopLayout>
      <SearchContent
        initialQ={p.q ?? ""}
        initialPage={parseInt(p.page ?? "1", 10)}
        initialSort={p.sort ?? "relevance"}
        initialMinPrice={p.minPrice ? parseInt(p.minPrice, 10) : undefined}
        initialMaxPrice={p.maxPrice ? parseInt(p.maxPrice, 10) : undefined}
        initialCategory={p.category ?? ""}
        initialInStock={p.inStock === "true"}
        initialRating={p.rating ? parseInt(p.rating, 10) : 0}
      />
    </ShopLayout>
  );
}
