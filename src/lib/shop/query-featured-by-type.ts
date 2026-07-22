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

// Fetch up to `limit` featured products for every top-level category that has them.
export async function queryFeaturedSections(limit = 10): Promise<FeaturedSection[]> {
  await connectDB();

  // All active top-level categories (no parentId)
  const parents = await Category.find({ parentId: null, isActive: true, deletedAt: null })
    .sort({ order: 1, name: 1 })
    .lean();

  const sections: FeaturedSection[] = [];

  for (const parent of parents) {
    const children = await Category.find({ parentId: parent._id, isActive: true, deletedAt: null }).lean();
    const childIds  = children.map((c) => c._id);

    // If there are no subcategories check products directly under this parent too
    const categoryIds = childIds.length > 0 ? childIds : [parent._id];

    const products = await Product.find({
      isActive: true,
      deletedAt: null,
      isFeatured: true,
      category: { $in: categoryIds },
    })
      .sort({ salesCount: -1, createdAt: -1 })
      .limit(limit)
      .populate("category", "name slug")
      .select("name slug basePrice compareAtPrice images reviewSummary.average reviewSummary.count isNewArrival isBestSeller category")
      .lean<FeaturedProduct[]>();

    if (products.length > 0) {
      sections.push({
        _id:      String(parent._id),
        name:     parent.name,
        slug:     parent.slug,
        products: products.map((p) => {
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
        }),
      });
    }
  }

  return sections;
}
