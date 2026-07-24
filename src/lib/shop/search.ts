import { connectDB } from "@/lib/db/connection";
import { Product } from "@/models/product.model";
import { SearchKeyword } from "@/models/search-keyword.model";
import type { PipelineStage } from "mongoose";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SearchOptions {
  q: string;
  page?: number;
  limit?: number;
  sort?: "relevance" | "newest" | "price-asc" | "price-desc" | "rating" | "popular" | "discount";
  minPrice?: number;
  maxPrice?: number;
  category?: string; // category slug
  inStock?: boolean;
  rating?: number; // minimum average
}

export interface SearchProduct {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice?: number;
  images: string[];
  brand?: string;
  stock: number;
  gender?: string;
  category: { _id: string; name: string; slug: string };
  reviewSummary: { average: number; count: number };
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  salesCount: number;
  tags: string[];
  discountPct: number;
}

export interface SearchResult {
  products: SearchProduct[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    categories: { _id: string; name: string; slug: string; count: number }[];
    priceRange: { min: number; max: number };
    brands: { name: string; count: number }[];
  };
  responseTimeMs: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type SortKey =
  | "relevance"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "popular"
  | "discount";

function buildSortStage(sort: SortKey, isAtlas: boolean): Record<string, 1 | -1> {
  switch (sort) {
    case "newest":
      return { createdAt: -1 };
    case "price-asc":
      return { basePrice: 1 };
    case "price-desc":
      return { basePrice: -1 };
    case "rating":
      return { "reviewSummary.average": -1 };
    case "popular":
      return { salesCount: -1 };
    case "discount":
      return { discountPct: -1 };
    case "relevance":
    default:
      return isAtlas ? { _score: -1, salesCount: -1 } : { salesCount: -1, isFeatured: -1 };
  }
}

function buildPriceFilter(
  minPrice?: number,
  maxPrice?: number
): Record<string, unknown> {
  if (minPrice == null && maxPrice == null) return {};
  const cond: Record<string, number> = {};
  if (minPrice != null && minPrice > 0) cond.$gte = minPrice;
  if (maxPrice != null && maxPrice > 0) cond.$lte = maxPrice;
  if (Object.keys(cond).length === 0) return {};
  return { basePrice: cond };
}

function buildStockFilter(inStock?: boolean): Record<string, unknown> {
  if (!inStock) return {};
  return { stock: { $gt: 0 } };
}

function buildRatingFilter(rating?: number): Record<string, unknown> {
  if (rating == null || rating <= 0) return {};
  return { "reviewSummary.average": { $gte: rating } };
}

const PRODUCT_PROJECT = {
  _id: 1,
  name: 1,
  slug: 1,
  basePrice: 1,
  compareAtPrice: 1,
  images: 1,
  brand: 1,
  stock: 1,
  gender: 1,
  "category._id": 1,
  "category.name": 1,
  "category.slug": 1,
  "reviewSummary.average": 1,
  "reviewSummary.count": 1,
  isFeatured: 1,
  isBestSeller: 1,
  isNewArrival: 1,
  salesCount: 1,
  tags: 1,
  discountPct: 1,
};

const DISCOUNT_ADDFIELDS: PipelineStage.AddFields = {
  $addFields: {
    discountPct: {
      $cond: [
        {
          $and: [
            { $gt: ["$compareAtPrice", 0] },
            { $gt: ["$compareAtPrice", "$basePrice"] },
          ],
        },
        {
          $round: [
            {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ["$compareAtPrice", "$basePrice"] },
                    "$compareAtPrice",
                  ],
                },
                100,
              ],
            },
            0,
          ],
        },
        0,
      ],
    },
  },
};

function buildFacetStage(
  sortStage: Record<string, 1 | -1>,
  skip: number,
  limit: number
): PipelineStage.Facet {
  return {
    $facet: {
      products: [
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limit },
        { $project: PRODUCT_PROJECT },
      ],
      total: [{ $count: "n" }],
      categoryFacets: [
        {
          $group: {
            _id: "$category._id",
            name: { $first: "$category.name" },
            slug: { $first: "$category.slug" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ],
      priceFacets: [
        {
          $group: {
            _id: null,
            min: { $min: "$basePrice" },
            max: { $max: "$basePrice" },
          },
        },
      ],
      brandFacets: [
        { $match: { brand: { $nin: [null, ""] } } },
        {
          $group: {
            _id: "$brand",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ],
    },
  };
}

function shapeFacetResult(raw: {
  products: SearchProduct[];
  total: Array<{ n: number }>;
  categoryFacets: Array<{ _id: string; name: string; slug: string; count: number }>;
  priceFacets: Array<{ min: number; max: number }>;
  brandFacets: Array<{ _id: string; count: number }>;
}) {
  return {
    products: raw.products ?? [],
    total: raw.total?.[0]?.n ?? 0,
    facets: {
      categories: (raw.categoryFacets ?? []).map((c) => ({
        _id: String(c._id),
        name: c.name ?? "",
        slug: c.slug ?? "",
        count: c.count,
      })),
      priceRange: {
        min: raw.priceFacets?.[0]?.min ?? 0,
        max: raw.priceFacets?.[0]?.max ?? 0,
      },
      brands: (raw.brandFacets ?? []).map((b) => ({
        name: b._id,
        count: b.count,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Atlas Search pipeline
// ---------------------------------------------------------------------------

function buildAtlasPipeline(
  q: string,
  opts: Required<SearchOptions>,
  sortStage: Record<string, 1 | -1>,
  skip: number,
  limit: number
): PipelineStage[] {
  const priceFilter = buildPriceFilter(opts.minPrice, opts.maxPrice);
  const stockFilter = buildStockFilter(opts.inStock);
  const ratingFilter = buildRatingFilter(opts.rating);

  const shouldClauses: Record<string, unknown>[] = [];

  if (q.length > 3) {
    shouldClauses.push({
      text: {
        query: q,
        path: "name",
        fuzzy: { maxEdits: 1, prefixLength: 2 },
        score: { boost: { value: 5 } },
      },
    });
  }

  shouldClauses.push({
    autocomplete: {
      query: q,
      path: "name",
      tokenOrder: "sequential",
      score: { boost: { value: 3 } },
    },
  });

  shouldClauses.push({
    text: {
      query: q,
      path: ["tags", "brand", "shortDescription"],
      fuzzy: { maxEdits: 1, prefixLength: 2 },
      score: { boost: { value: 2 } },
    },
  });

  shouldClauses.push({
    text: {
      query: q,
      path: "description",
      score: { boost: { value: 1 } },
    },
  });

  const pipeline: PipelineStage[] = [
    {
      $search: {
        index: "product_search",
        compound: {
          filter: [{ equals: { path: "isActive", value: true } }],
          should: shouldClauses,
          minimumShouldMatch: 1,
        },
      },
    } as PipelineStage,
    {
      $addFields: { _score: { $meta: "searchScore" } },
    },
    {
      $match: {
        deletedAt: null,
        ...priceFilter,
        ...stockFilter,
        ...ratingFilter,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  if (opts.category) {
    pipeline.push({ $match: { "category.slug": opts.category } });
  }

  pipeline.push(DISCOUNT_ADDFIELDS);
  pipeline.push(buildFacetStage(sortStage, skip, limit));

  return pipeline;
}

// ---------------------------------------------------------------------------
// Regex (fallback) pipeline
// ---------------------------------------------------------------------------

function buildRegexPipeline(
  q: string,
  opts: Required<SearchOptions>,
  sortStage: Record<string, 1 | -1>,
  skip: number,
  limit: number
): PipelineStage[] {
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(safe, "i");

  const priceFilter = buildPriceFilter(opts.minPrice, opts.maxPrice);
  const stockFilter = buildStockFilter(opts.inStock);
  const ratingFilter = buildRatingFilter(opts.rating);

  const pipeline: PipelineStage[] = [
    {
      $match: {
        isActive: true,
        deletedAt: null,
        $or: [
          { name: regex },
          { tags: regex },
          { brand: regex },
          { shortDescription: regex },
        ],
        ...priceFilter,
        ...stockFilter,
        ...ratingFilter,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  if (opts.category) {
    pipeline.push({ $match: { "category.slug": opts.category } });
  }

  pipeline.push(DISCOUNT_ADDFIELDS);
  pipeline.push(buildFacetStage(sortStage, skip, limit));

  return pipeline;
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

export async function searchProducts(opts: SearchOptions): Promise<SearchResult> {
  const start = Date.now();

  await connectDB();

  const q = opts.q.trim();
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(Math.max(1, opts.limit ?? 12), 24);
  const skip = (page - 1) * limit;
  const sort: SortKey = opts.sort ?? "relevance";

  const resolvedOpts: Required<SearchOptions> = {
    q,
    page,
    limit,
    sort,
    minPrice: opts.minPrice ?? 0,
    maxPrice: opts.maxPrice ?? 0,
    category: opts.category ?? "",
    inStock: opts.inStock ?? false,
    rating: opts.rating ?? 0,
  };

  const atlasEnabled = process.env.ATLAS_SEARCH_ENABLED === "true";
  let rawResult: ReturnType<typeof shapeFacetResult> | null = null;

  // Try Atlas Search only when explicitly enabled via env var
  if (atlasEnabled) {
    try {
      const sortStage = buildSortStage(sort, true);
      const pipeline = buildAtlasPipeline(q, resolvedOpts, sortStage, skip, limit);
      const [facetDoc] = await Product.aggregate(pipeline).exec();
      const shaped = shapeFacetResult(facetDoc);
      // Only use Atlas result if it actually found something
      if (shaped.total > 0) rawResult = shaped;
    } catch {
      // Atlas Search not configured — fall through to regex
    }
  }

  // Always fall back to regex search when Atlas is disabled or returned nothing
  if (rawResult == null) {
    const sortStage = buildSortStage(sort, false);
    const pipeline = buildRegexPipeline(q, resolvedOpts, sortStage, skip, limit);
    const [facetDoc] = await Product.aggregate(pipeline).exec();
    rawResult = shapeFacetResult(facetDoc);
  }

  const total = rawResult.total;
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

  return {
    products: rawResult.products,
    total,
    page,
    totalPages,
    facets: rawResult.facets,
    responseTimeMs: Date.now() - start,
  };
}

// ---------------------------------------------------------------------------
// Suggest function
// ---------------------------------------------------------------------------

export async function suggestProducts(q: string): Promise<{
  products: Pick<SearchProduct, "_id" | "name" | "slug" | "images" | "basePrice" | "category">[];
  keywords: string[];
}> {
  await connectDB();

  const PRODUCT_LIMIT = 6;
  const KEYWORD_LIMIT = 4;

  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keywordRegex = new RegExp(`^${safe}`, "i");

  const SUGGEST_PROJECT: PipelineStage.Project = {
    $project: {
      _id: 1,
      name: 1,
      slug: 1,
      images: 1,
      basePrice: 1,
      "category._id": 1,
      "category.name": 1,
      "category.slug": 1,
    },
  };

  const CATEGORY_LOOKUP: PipelineStage.Lookup = {
    $lookup: {
      from: "categories",
      localField: "category",
      foreignField: "_id",
      as: "category",
    },
  };

  const CATEGORY_UNWIND: PipelineStage.Unwind = {
    $unwind: {
      path: "$category",
      preserveNullAndEmptyArrays: true,
    },
  };

  const atlasEnabled = process.env.ATLAS_SEARCH_ENABLED === "true";
  const nameRegex = new RegExp(safe, "i");

  // Rank 0 = name starts with query, 1 = name contains query, 2 = tag/brand/desc match
  const nameStartsRegex = new RegExp(`^${safe}`, "i");

  const regexPipeline: PipelineStage[] = [
    {
      $match: {
        isActive: true,
        deletedAt: null,
        $or: [
          { name: nameRegex },
          { tags: nameRegex },
          { brand: nameRegex },
          { shortDescription: nameRegex },
        ],
      },
    },
    {
      $addFields: {
        _relevance: {
          $switch: {
            branches: [
              { case: { $regexMatch: { input: "$name", regex: nameStartsRegex.source, options: "i" } }, then: 0 },
              { case: { $regexMatch: { input: "$name", regex: nameRegex.source, options: "i" } }, then: 1 },
            ],
            default: 2,
          },
        },
      },
    },
    { $sort: { _relevance: 1, salesCount: -1, isFeatured: -1 } },
    { $limit: PRODUCT_LIMIT },
    CATEGORY_LOOKUP,
    CATEGORY_UNWIND,
    SUGGEST_PROJECT,
  ];

  const [keywordDocs, products] = await Promise.all([
    SearchKeyword.find({ keyword: keywordRegex })
      .sort({ searchCount: -1 })
      .limit(KEYWORD_LIMIT)
      .select("keyword")
      .lean(),
    (async () => {
      // Only try Atlas autocomplete when explicitly enabled
      if (atlasEnabled) {
        try {
          const atlasPipeline: PipelineStage[] = [
            {
              $search: {
                index: "product_search",
                autocomplete: {
                  query: q,
                  path: "name",
                  tokenOrder: "sequential",
                },
              },
            } as PipelineStage,
            { $match: { isActive: true, deletedAt: null } },
            { $limit: PRODUCT_LIMIT },
            CATEGORY_LOOKUP,
            CATEGORY_UNWIND,
            SUGGEST_PROJECT,
          ];
          const atlasResults = await Product.aggregate(atlasPipeline).exec();
          // Use Atlas results only if they returned something
          if (atlasResults.length > 0) return atlasResults;
        } catch {
          // Atlas Search not configured — fall through to regex
        }
      }
      // Always fall back to multi-field regex search
      return await Product.aggregate(regexPipeline).exec();
    })(),
  ]);

  return {
    products: products.map((p) => ({
      _id: String(p._id),
      name: p.name as string,
      slug: p.slug as string,
      images: (p.images as string[]) ?? [],
      basePrice: p.basePrice as number,
      category: {
        _id: String(p.category?._id ?? ""),
        name: (p.category?.name as string) ?? "",
        slug: (p.category?.slug as string) ?? "",
      },
    })),
    keywords: keywordDocs.map((k) => k.keyword),
  };
}
