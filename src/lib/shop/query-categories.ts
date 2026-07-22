import { connectDB } from "@/lib/db/connection";
import { Category } from "@/models/category.model";

export interface SubCategoryItem {
  _id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  productCount: number;
  image?: string;
  subcategories: SubCategoryItem[];
}

export async function queryCategories(): Promise<CategoryItem[]> {
  await connectDB();

  const all = await Category.find({ isActive: true, deletedAt: null })
    .sort({ order: 1, name: 1 })
    .select("name slug parentId productCount image")
    .lean();

  const parents  = all.filter((c) => !c.parentId);
  const children = all.filter((c) => !!c.parentId);

  return parents.map((parent) => ({
    _id:          String(parent._id),
    name:         parent.name,
    slug:         parent.slug,
    productCount: parent.productCount ?? 0,
    image:        parent.image,
    subcategories: children
      .filter((c) => String(c.parentId) === String(parent._id))
      .map((c) => ({
        _id:          String(c._id),
        name:         c.name,
        slug:         c.slug,
        productCount: c.productCount ?? 0,
      })),
  }));
}
