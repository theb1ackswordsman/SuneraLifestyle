// UI fallback for the shop when the database is unreachable (e.g. no DB / IP not
// whitelisted). Mirrors the mock-data fallback the hero banner already uses, so
// the storefront UI still renders. Does NOT alter the real DB query logic.

import { MOCK_PRODUCTS } from "@/data/mock/homepage";
import type { ProductQuery, ProductQueryResult, ProductListItem } from "./query-products";
import type { CategoryItem } from "./query-categories";

const CATEGORY_NAMES: Record<string, string> = {
  detox: "Detox & Cleanse",
  immunity: "Immunity",
  "weight-management": "Weight Management",
  "digestive-care": "Digestive Care",
  "womens-care": "Women's Care",
  "mens-wellness": "Men's Wellness",
  "ayurvedic-medicine": "Ayurvedic Medicine",
  kurtis: "Kurtis",
  suits: "Suits & Sets",
};

function toListItem(p: (typeof MOCK_PRODUCTS)[number]): ProductListItem {
  const slug = p.category;
  return {
    _id: p.id,
    name: p.name,
    slug: p.slug,
    basePrice: p.price,
    compareAtPrice: p.compareAtPrice,
    images: [p.image],
    reviewSummary: { average: p.rating, count: p.reviewCount },
    isNewArrival: p.badge === "new",
    isBestSeller: p.badge === "bestseller",
    isFeatured: false,
    category: { _id: slug, name: CATEGORY_NAMES[slug] ?? p.category, slug },
  };
}

export function fallbackCategories(): CategoryItem[] {
  const counts = new Map<string, number>();
  for (const p of MOCK_PRODUCTS) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  // Group mock subcategories under two top-level parents
  const ayurveda = ["detox","immunity","weight-management","digestive-care","womens-care","mens-wellness","ayurvedic-medicine"];
  const clothing  = ["kurtis","suits"];
  function makeSubs(slugs: string[]) {
    return slugs.filter((s) => counts.has(s)).map((slug) => ({
      _id: slug, name: CATEGORY_NAMES[slug] ?? slug, slug, productCount: counts.get(slug) ?? 0,
    }));
  }
  return [
    { _id: "ayurveda", name: "Ayurvedic Products", slug: "ayurveda", productCount: 0, subcategories: makeSubs(ayurveda) },
    { _id: "clothing",  name: "Ethnic Wear",         slug: "clothing",  productCount: 0, subcategories: makeSubs(clothing)  },
  ];
}

export function fallbackProducts(opts: ProductQuery = {}): ProductQueryResult {
  const { category, minPrice, maxPrice, sort, search, badge, page = 1, limit = 12 } = opts;
  let items = MOCK_PRODUCTS.map(toListItem);

  if (category) items = items.filter((p) => p.category.slug === category);
  if (search) {
    const q = search.toLowerCase();
    items = items.filter((p) => p.name.toLowerCase().includes(q));
  }
  if (minPrice != null) items = items.filter((p) => p.basePrice >= minPrice);
  if (maxPrice != null) items = items.filter((p) => p.basePrice <= maxPrice);
  if (badge === "new") items = items.filter((p) => p.isNewArrival);
  if (badge === "bestseller") items = items.filter((p) => p.isBestSeller);
  if (badge === "sale") items = items.filter((p) => p.compareAtPrice && p.compareAtPrice > p.basePrice);

  switch (sort) {
    case "price-asc":  items.sort((a, b) => a.basePrice - b.basePrice); break;
    case "price-desc": items.sort((a, b) => b.basePrice - a.basePrice); break;
    case "rating":     items.sort((a, b) => b.reviewSummary.average - a.reviewSummary.average); break;
    default: break;
  }

  const total = items.length;
  const pageNum = Math.max(1, page);
  const start = (pageNum - 1) * limit;

  return {
    products: items.slice(start, start + limit),
    total,
    totalPages: Math.ceil(total / limit) || 1,
    page: pageNum,
    limit,
  };
}
