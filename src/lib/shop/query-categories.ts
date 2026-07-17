import { connectDB } from "@/lib/db/connection";
import { Category } from "@/models/category.model";

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  productCount: number;
  image?: string;
}

export async function queryCategories(): Promise<CategoryItem[]> {
  await connectDB();
  const docs = await Category.find({ isActive: true, deletedAt: null })
    .sort({ order: 1, name: 1 })
    .select("name slug productCount image")
    .lean<CategoryItem[]>();
  return docs;
}
