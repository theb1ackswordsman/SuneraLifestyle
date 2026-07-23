import { connectDB } from "@/lib/db/connection";
import { Category } from "@/models/category.model";
import { Product } from "@/models/product.model";

export interface FeaturedProduct {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice?: number;
  images: string[];
  reviewSummary: { average: number; count: number };
  isNewArrival: boolean;
  isBestSeller: boolean;
  category: { _id: string; name: string; slug: string };
}

export interface FeaturedSection {
  _id: string;
  name: string;
  slug: string;
  products: FeaturedProduct[];
}

const SELECT = "name slug basePrice compareAtPrice images reviewSummary.average reviewSummary.count isNewArrival isBestSeller category";

function normalizeProduct(p: FeaturedProduct): FeaturedProduct {
  const cat = p.category as unknown as { _id: unknown; name: string; slug: string } | null;
  return {
    ...p,
    _id: String(p._id),
    reviewSummary: {
      average: p.reviewSummary?.average ?? 0,
      count:   p.reviewSummary?.count   ?? 0,
    },
    category: cat
      ? { _id: String(cat._id), name: cat.name, slug: cat.slug }
      : { _id: "", name: "", slug: "" },
  };
}

// For each top-level category show up to `limit` admin-featured products.
// If fewer than `limit` are featured, fill remaining slots with the most recently added products.
export async function queryFeaturedSections(limit = 5): Promise<FeaturedSection[]> {
  await connectDB();

  const parents = await Category.find({ parentId: null, isActive: true, deletedAt: null })
    .sort({ order: 1, name: 1 })
    .lean();

  const sections: FeaturedSection[] = [];

  for (const parent of parents) {
    const children = await Category.find({ parentId: parent._id, isActive: true, deletedAt: null }).lean();
    const childIds  = children.map((c) => c._id);
    const categoryIds = childIds.length > 0 ? childIds : [parent._id];

    const base = { isActive: true, deletedAt: null, category: { $in: categoryIds } };

    // 1. Fetch admin-featured products first
    const featured = await Product.find({ ...base, isFeatured: true })
      .sort({ salesCount: -1, createdAt: -1 })
      .limit(limit)
      .populate("category", "name slug")
      .select(SELECT)
      .lean<FeaturedProduct[]>();

    let products = featured;

    // 2. If not enough featured, fill remaining slots with most-recently-added
    if (featured.length < limit) {
      const featuredIds = featured.map((p) => p._id);
      const recent = await Product.find({ ...base, _id: { $nin: featuredIds } })
        .sort({ createdAt: -1 })
        .limit(limit - featured.length)
        .populate("category", "name slug")
        .select(SELECT)
        .lean<FeaturedProduct[]>();
      products = [...featured, ...recent];
    }

    if (products.length > 0) {
      sections.push({
        _id:      String(parent._id),
        name:     parent.name,
        slug:     parent.slug,
        products: products.map(normalizeProduct),
      });
    }
  }

  return sections;
}
