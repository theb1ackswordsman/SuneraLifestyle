import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Category } from "@/models/category.model";
import { ok, created, badRequest, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

// GET — list all categories (flat, with parentId populated)
export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({ deletedAt: null })
      .sort({ order: 1, name: 1 })
      .select("name slug parentId isActive order productCount")
      .populate("parentId", "name slug")
      .lean();
    return ok(categories);
  } catch (err) {
    return handleApiError(err);
  }
}

// POST — create category
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, slug, parentId, description, order } = body;

    if (!name?.trim()) return badRequest("Name is required.");
    if (!slug?.trim()) return badRequest("Slug is required.");

    const existing = await Category.findOne({ slug: slug.toLowerCase(), deletedAt: null });
    if (existing) return badRequest("A category with this slug already exists.");

    const category = await Category.create({
      name: name.trim(),
      slug: slug.toLowerCase().trim(),
      description: description?.trim(),
      parentId: parentId || null,
      order: order ?? 0,
    });

    return created(category, "Category created.");
  } catch (err) {
    return handleApiError(err);
  }
}
