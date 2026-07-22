import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Product } from "@/models/product.model";
import { Category } from "@/models/category.model";

export const dynamic = "force-dynamic";

// GET /api/sizes?type=<parent-slug>  OR  ?category=<sub-slug>
// Returns distinct, non-empty sizes from variants of matching products.
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type     = searchParams.get("type");
    const category = searchParams.get("category");

    let categoryIds: string[] = [];

    if (category) {
      // Single subcategory
      const cat = await Category.findOne({ slug: category, isActive: true, deletedAt: null }).lean();
      if (cat) categoryIds = [String(cat._id)];
    } else if (type) {
      // All subcategories of this top-level parent
      const parent = await Category.findOne({ slug: type, isActive: true, deletedAt: null }).lean();
      if (parent) {
        const children = await Category.find({ parentId: parent._id, isActive: true, deletedAt: null }).lean();
        categoryIds = children.map((c) => String(c._id));
      }
    }

    const match: Record<string, unknown> = { isActive: true, deletedAt: null, "variants.size": { $exists: true, $ne: "" } };
    if (categoryIds.length > 0) {
      match.category = { $in: categoryIds };
    }

    const sizes: string[] = await Product.distinct("variants.size", match);
    const sorted = sizes
      .filter(Boolean)
      .sort((a, b) => {
        const order = ["XS","S","M","L","XL","XXL","3XL","4XL","Free Size"];
        const ai = order.indexOf(a), bi = order.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.localeCompare(b);
      });

    return NextResponse.json({ data: sorted });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
