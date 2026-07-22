import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Category } from "@/models/category.model";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();

    // Fetch all active categories in one query
    const all = await Category.find({ isActive: true, deletedAt: null })
      .sort({ order: 1, name: 1 })
      .select("name slug parentId")
      .lean();

    // Split into parents (no parentId) and children
    const parents = all.filter((c) => !c.parentId);
    const children = all.filter((c) => c.parentId);

    const nav = parents.map((parent) => ({
      _id:  String(parent._id),
      name: parent.name,
      slug: parent.slug,
      href: `/shop?type=${parent.slug}`,
      subcategories: children
        .filter((c) => String(c.parentId) === String(parent._id))
        .map((c) => ({
          _id:  String(c._id),
          name: c.name,
          slug: c.slug,
          href: `/shop?category=${c.slug}`,
        })),
    }));

    return NextResponse.json({ data: nav });
  } catch {
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
