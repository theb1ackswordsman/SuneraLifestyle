import type { PipelineStage } from "mongoose";
import { connectDB } from "@/lib/db/connection";
import { Product } from "@/models/product.model";

export type SortOption = "featured" | "newest" | "price-asc" | "price-desc" | "rating" | "popular";
export type BadgeFilter = "new" | "bestseller" | "sale";

export interface ProductQuery {
  category?: string;
  categorySlugs?: string[]; // filter by multiple slugs (used when a top-level type is selected)
  size?: string;            // variant size filter (clothing)
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  page?: number;
  limit?: number;
  search?: string;
  badge?: BadgeFilter;
}

export interface ProductListItem {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice?: number;
  images: string[];
  reviewSummary: { average: number; count: number };
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  category: { _id: string; name: string; slug: string };
}

export interface ProductQueryResult {
  products: ProductListItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

const SORT_STAGES: Record<SortOption, Record<string, 1 | -1>> = {
  featured:    { isFeatured: -1, salesCount: -1, _id: -1 },
  newest:      { createdAt: -1 },
  "price-asc": { basePrice: 1 },
  "price-desc":{ basePrice: -1 },
  rating:      { "reviewSummary.average": -1, "reviewSummary.count": -1 },
  popular:     { salesCount: -1 },
};

const VALID_SORTS = new Set<SortOption>(["featured", "newest", "price-asc", "price-desc", "rating", "popular"]);

export async function queryProducts(opts: ProductQuery = {}): Promise<ProductQueryResult> {
  await connectDB();

  const {
    category,
    categorySlugs,
    size,
    minPrice,
    maxPrice,
    page = 1,
    limit = 12,
    search,
    badge,
  } = opts;

  const sort: SortOption = VALID_SORTS.has(opts.sort as SortOption) ? (opts.sort as SortOption) : "featured";
  const pageNum = Math.max(1, page);
  const limitNum = Math.min(48, Math.max(4, limit));
  const skip = (pageNum - 1) * limitNum;

  const baseMatch: Record<string, unknown> = { isActive: true, deletedAt: null };

  if (search) baseMatch.$text = { $search: search };

  if (minPrice != null || maxPrice != null) {
    const p: Record<string, number> = {};
    if (minPrice != null) p.$gte = minPrice;
    if (maxPrice != null) p.$lte = maxPrice;
    baseMatch.basePrice = p;
  }

  if (size) baseMatch["variants.size"] = size;

  if (badge === "new")        baseMatch.isNewArrival = true;
  if (badge === "bestseller") baseMatch.isBestSeller = true;
  if (badge === "sale") {
    baseMatch.compareAtPrice = { $exists: true, $ne: null };
    baseMatch.$expr = { $gt: ["$compareAtPrice", "$basePrice"] };
  }

  const pipeline: PipelineStage[] = [
    { $match: baseMatch },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
        pipeline: [{ $project: { name: 1, slug: 1 } }],
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    ...(category
      ? [{ $match: { "category.slug": category } }]
      : categorySlugs?.length
      ? [{ $match: { "category.slug": { $in: categorySlugs } } }]
      : []),
    { $sort: SORT_STAGES[sort] },
    {
      $facet: {
        products: [
          { $skip: skip },
          { $limit: limitNum },
          {
            $project: {
              name: 1, slug: 1, basePrice: 1, compareAtPrice: 1,
              images: { $slice: ["$images", 1] },
              "reviewSummary.average": 1,
              "reviewSummary.count": 1,
              isNewArrival: 1, isBestSeller: 1, isFeatured: 1,
              "category._id": 1, "category.name": 1, "category.slug": 1,
            },
          },
        ],
        meta: [{ $count: "total" }],
      },
    },
  ];

  type FacetResult = { products: ProductListItem[]; meta: { total: number }[] };
  const [result] = await Product.aggregate<FacetResult>(pipeline);
  const total = result?.meta?.[0]?.total ?? 0;

  const serialize = (p: ProductListItem): ProductListItem => ({
    ...p,
    _id: String(p._id),
    reviewSummary: {
      average: p.reviewSummary?.average ?? 0,
      count:   p.reviewSummary?.count   ?? 0,
    },
    category: p.category
      ? { _id: String(p.category._id), name: p.category.name, slug: p.category.slug }
      : p.category,
  });

  return {
    products: (result?.products ?? []).map(serialize),
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
    page: pageNum,
    limit: limitNum,
  };
}
