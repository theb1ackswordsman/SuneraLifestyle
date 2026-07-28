import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db/connection";
import { Product } from "@/models/product.model";
import { Category } from "@/models/category.model";

export const revalidate = 86400; // Revalidate sitemap daily

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://suneralifestyle.in";

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    await connectDB();

    // Dynamic Product URLs
    const products = await Product.find({ isActive: true, deletedAt: null })
      .select("slug updatedAt")
      .lean();

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: (p as { updatedAt?: Date }).updatedAt ? new Date((p as { updatedAt?: Date }).updatedAt!) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // Dynamic Category URLs
    const categories = await Category.find({ isActive: true, deletedAt: null })
      .select("slug updatedAt")
      .lean();

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${baseUrl}/shop?category=${c.slug}`,
      lastModified: (c as { updatedAt?: Date }).updatedAt ? new Date((c as { updatedAt?: Date }).updatedAt!) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
