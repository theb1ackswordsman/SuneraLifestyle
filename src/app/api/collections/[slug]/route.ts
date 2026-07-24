import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Collection } from "@/models/collection.model";
import { Product } from "@/models/product.model";
import { ok, notFound, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    const collection = await Collection.findOne({ slug, isActive: true }).lean();
    if (!collection) return notFound("Collection not found.");

    let productQuery: Record<string, unknown> = { isActive: true, deletedAt: null };

    if (collection.productAssignment === "manual" && collection.manualProductIds?.length) {
      productQuery._id = { $in: collection.manualProductIds };
    } else if (collection.productAssignment === "auto-tags" && collection.autoTags?.length) {
      productQuery.tags = { $in: collection.autoTags };
    } else if (collection.productAssignment === "auto-category" && collection.autoCategorySlug) {
      // Join through category — find products whose category slug matches
      const { Category } = await import("@/models/category.model");
      const cat = await Category.findOne({ slug: collection.autoCategorySlug }).lean();
      if (cat) productQuery.category = (cat as { _id: unknown })._id;
    }

    const products = await Product.find(productQuery)
      .select("_id name slug basePrice compareAtPrice images stock isFeatured isBestSeller isNewArrival tags")
      .limit(48)
      .lean();

    return ok({ collection, products });
  } catch (err) {
    return handleApiError(err);
  }
}
