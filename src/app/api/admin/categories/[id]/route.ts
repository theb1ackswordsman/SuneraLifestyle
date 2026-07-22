import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Category } from "@/models/category.model";
import { ok, badRequest, notFound, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

// PATCH — update
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { name, slug, parentId, description, isActive, order } = body;

    const category = await Category.findOne({ _id: id, deletedAt: null });
    if (!category) return notFound("Category not found.");

    if (slug && slug !== category.slug) {
      const conflict = await Category.findOne({ slug: slug.toLowerCase(), deletedAt: null, _id: { $ne: id } });
      if (conflict) return badRequest("A category with this slug already exists.");
    }

    if (name !== undefined)        category.name        = name.trim();
    if (slug !== undefined)        category.slug        = slug.toLowerCase().trim();
    if (description !== undefined) category.description = description?.trim();
    if (parentId !== undefined)    category.parentId    = parentId || undefined;
    if (isActive !== undefined)    category.isActive    = isActive;
    if (order !== undefined)       category.order       = order;

    await category.save();
    return ok(category, "Category updated.");
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE — soft delete
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const category = await Category.findOne({ _id: id, deletedAt: null });
    if (!category) return notFound("Category not found.");

    // Also soft-delete children
    await Category.updateMany({ parentId: id, deletedAt: null }, { deletedAt: new Date() });
    category.deletedAt = new Date();
    await category.save();

    return ok(null, "Category deleted.");
  } catch (err) {
    return handleApiError(err);
  }
}
