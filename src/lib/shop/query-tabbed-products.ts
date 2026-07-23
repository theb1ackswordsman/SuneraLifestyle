import { connectDB } from "@/lib/db/connection";
import { Product } from "@/models/product.model";

export interface TabbedProduct {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice?: number;
  images: string[];
  stock: number;
  reviewSummary: { average: number; count: number };
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
}

export interface TabbedProductSets {
  newArrivals: TabbedProduct[];
  bestSellers: TabbedProduct[];
  topRated: TabbedProduct[];
}

const SELECT =
  "name slug basePrice compareAtPrice images stock reviewSummary.average reviewSummary.count isNewArrival isBestSeller isFeatured";

function normalize(p: TabbedProduct): TabbedProduct {
  return {
    ...p,
    _id: String(p._id),
    reviewSummary: {
      average: p.reviewSummary?.average ?? 0,
      count:   p.reviewSummary?.count   ?? 0,
    },
  };
}

export async function queryTabbedProducts(limit = 5): Promise<TabbedProductSets> {
  await connectDB();

  const base = { isActive: true, deletedAt: null };

  const [newArrivals, bestSellers, topRated] = await Promise.all([
    Product.find({ ...base, isNewArrival: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(SELECT)
      .lean<TabbedProduct[]>(),

    Product.find({ ...base, isBestSeller: true })
      .sort({ salesCount: -1, createdAt: -1 })
      .limit(limit)
      .select(SELECT)
      .lean<TabbedProduct[]>(),

    Product.find(base)
      .sort({ "reviewSummary.average": -1, "reviewSummary.count": -1 })
      .limit(limit)
      .select(SELECT)
      .lean<TabbedProduct[]>(),
  ]);

  return {
    newArrivals: newArrivals.map(normalize),
    bestSellers: bestSellers.map(normalize),
    topRated:    topRated.map(normalize),
  };
}
