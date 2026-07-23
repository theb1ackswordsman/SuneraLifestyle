import { connectDB } from "@/lib/db/connection";
import { Product } from "@/models/product.model";
import { Category } from "@/models/category.model";

export interface ProductDetail {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: string[];
  basePrice: number;
  compareAtPrice?: number;
  stock: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  category: { _id: string; name: string; slug: string; parentId?: string | null };
  reviewSummary: {
    average: number;
    count: number;
    distribution: { star: number; count: number }[];
  };
  benefits: string[];
  ingredients: string[];
  tags: string[];
  directions?: string;
  warnings?: string;
  shippingDetails?: string;
  returnPolicy?: string;
  variants: {
    _id: string;
    sku: string;
    size?: string;
    color?: string;
    colorHex?: string;
    stock: number;
    price?: number;
    compareAtPrice?: number;
  }[];
}

export interface RelatedProduct {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice?: number;
  images: string[];
  reviewSummary: { average: number; count: number };
  isNewArrival: boolean;
  isBestSeller: boolean;
}

export interface RemovedProductInfo {
  name: string;
  image?: string;
  categoryName?: string;
  categorySlug?: string;
}

export async function queryRemovedProductBySlug(slug: string): Promise<RemovedProductInfo | null> {
  await connectDB();
  const raw = await Product.findOne({ slug })
    .populate("category", "name slug")
    .lean<Record<string, unknown>>();
  if (!raw) return null;
  const cat = raw.category as Record<string, unknown> | null;
  return {
    name:         String(raw.name ?? ""),
    image:        (raw.images as string[] | undefined)?.[0],
    categoryName: cat ? String(cat.name ?? "") : undefined,
    categorySlug: cat ? String(cat.slug ?? "") : undefined,
  };
}

export async function queryProductBySlug(slug: string): Promise<ProductDetail | null> {
  await connectDB();

  const raw = await Product.findOne({ slug, isActive: true, deletedAt: null })
    .populate("category", "name slug parentId")
    .lean<Record<string, unknown>>();

  if (!raw) return null;

  const cat = raw.category as Record<string, unknown> | null;
  const rs  = raw.reviewSummary as Record<string, unknown> | null;
  const dist = (rs?.distribution as { star: number; count: number }[] | undefined) ?? [];

  const variants = ((raw.variants as Record<string, unknown>[]) ?? []).map((v) => ({
    _id:            String(v._id),
    sku:            String(v.sku ?? ""),
    size:           v.size as string | undefined,
    color:          v.color as string | undefined,
    colorHex:       v.colorHex as string | undefined,
    stock:          Number(v.stock ?? 0),
    price:          v.price != null ? Number(v.price) : undefined,
    compareAtPrice: v.compareAtPrice != null ? Number(v.compareAtPrice) : undefined,
  }));

  return {
    _id:             String(raw._id),
    name:            String(raw.name ?? ""),
    slug:            String(raw.slug ?? ""),
    description:     String(raw.description ?? ""),
    shortDescription: raw.shortDescription ? String(raw.shortDescription) : undefined,
    images:          (raw.images as string[] | undefined) ?? [],
    basePrice:       Number(raw.basePrice ?? 0),
    compareAtPrice:  raw.compareAtPrice != null ? Number(raw.compareAtPrice) : undefined,
    stock:           Number(raw.stock ?? 0),
    isNewArrival:    Boolean(raw.isNewArrival),
    isBestSeller:    Boolean(raw.isBestSeller),
    isFeatured:      Boolean(raw.isFeatured),
    category: cat
      ? { _id: String(cat._id), name: String(cat.name ?? ""), slug: String(cat.slug ?? ""), parentId: cat.parentId ? String(cat.parentId) : null }
      : { _id: "", name: "", slug: "" },
    reviewSummary: {
      average:      Number(rs?.average ?? 0),
      count:        Number(rs?.count ?? 0),
      distribution: dist.map((d) => ({ star: Number(d.star), count: Number(d.count) })),
    },
    benefits:       (raw.benefits as string[] | undefined) ?? [],
    ingredients:    (raw.ingredients as string[] | undefined) ?? [],
    tags:           (raw.tags as string[] | undefined) ?? [],
    directions:     raw.directions ? String(raw.directions) : undefined,
    warnings:       raw.warnings ? String(raw.warnings) : undefined,
    shippingDetails: raw.shippingDetails ? String(raw.shippingDetails) : undefined,
    returnPolicy:   raw.returnPolicy ? String(raw.returnPolicy) : undefined,
    variants,
  };
}

export async function queryRelatedProducts(
  categoryId: string,
  excludeSlug: string,
  limit = 6,
): Promise<RelatedProduct[]> {
  await connectDB();

  // First try same category; fall back to sibling categories via parent
  let products = await Product.find({
    category: categoryId,
    slug: { $ne: excludeSlug },
    isActive: true,
    deletedAt: null,
  })
    .sort({ salesCount: -1, isFeatured: -1 })
    .limit(limit)
    .select("name slug basePrice compareAtPrice images reviewSummary.average reviewSummary.count isNewArrival isBestSeller")
    .lean<Record<string, unknown>[]>();

  // If not enough, broaden to sibling categories (same parent)
  if (products.length < limit) {
    const cat = await Category.findById(categoryId).lean<{ parentId?: unknown } | null>();
    const parentId = cat?.parentId;
    if (parentId) {
      const siblings = await Category.find({ parentId, _id: { $ne: categoryId }, isActive: true })
        .select("_id").lean<{ _id: unknown }[]>();
      const siblingIds = siblings.map((s) => s._id);
      if (siblingIds.length) {
        const extra = await Product.find({
          category: { $in: siblingIds },
          slug: { $ne: excludeSlug },
          isActive: true,
          deletedAt: null,
        })
          .sort({ salesCount: -1 })
          .limit(limit - products.length)
          .select("name slug basePrice compareAtPrice images reviewSummary.average reviewSummary.count isNewArrival isBestSeller")
          .lean<Record<string, unknown>[]>();
        products = [...products, ...extra];
      }
    }
  }

  return products.map((p) => {
    const rs = p.reviewSummary as Record<string, unknown> | null;
    return {
      _id:           String(p._id),
      name:          String(p.name ?? ""),
      slug:          String(p.slug ?? ""),
      basePrice:     Number(p.basePrice ?? 0),
      compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : undefined,
      images:        (p.images as string[] | undefined) ?? [],
      reviewSummary: { average: Number(rs?.average ?? 0), count: Number(rs?.count ?? 0) },
      isNewArrival:  Boolean(p.isNewArrival),
      isBestSeller:  Boolean(p.isBestSeller),
    };
  });
}
