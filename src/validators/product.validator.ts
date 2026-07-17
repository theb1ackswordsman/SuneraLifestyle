import { z } from "zod";

const variantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  size: z.string().optional(),
  color: z.string().optional(),
  colorHex: z.string().optional(),
  flavor: z.string().optional(),
  weight: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  compareAtPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  images: z.array(z.string()).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(2, "Name is required").max(300),
  description: z.string().min(10, "Description is required"),
  shortDescription: z.string().max(500).optional(),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  images: z.array(z.string()).min(1, "At least one image is required"),
  videos: z.array(z.string()).optional(),
  variants: z.array(variantSchema).optional(),
  basePrice: z.number().min(0, "Price must be non-negative"),
  compareAtPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(true),
  isBestSeller: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  benefits: z.array(z.string()).optional(),
  ingredients: z.array(z.string()).optional(),
  directions: z.string().optional(),
  warnings: z.string().optional(),
  gender: z.enum(["men", "women", "unisex"]).optional(),
  seo: z.object({
    title: z.string().max(70).optional(),
    description: z.string().max(160).optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productFilterSchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  inStock: z.coerce.boolean().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  flavor: z.string().optional(),
  gender: z.string().optional(),
  discount: z.coerce.boolean().optional(),
  sort: z.enum(["newest", "best-selling", "price-asc", "price-desc", "rating", "popular"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
