export interface IProductVariant {
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  flavor?: string;
  weight?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images?: string[];
}

export interface INutritionFact {
  label: string;
  value: string;
  dailyValue?: string;
}

export interface IProductReviewSummary {
  average: number;
  count: number;
  distribution: { star: number; count: number }[];
}

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  sku: string;
  barcode?: string;
  images: string[];
  videos?: string[];
  variants: IProductVariant[];
  basePrice: number;
  compareAtPrice?: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  tags: string[];
  benefits?: string[];
  ingredients?: string[];
  nutritionFacts?: INutritionFact[];
  directions?: string;
  warnings?: string;
  manufacturingDetails?: string;
  expiryMonths?: number;
  certificates?: string[];
  shippingDetails?: string;
  returnPolicy?: string;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  reviewSummary: IProductReviewSummary;
  salesCount: number;
  viewCount: number;
  gender?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  order: number;
  seo: {
    title?: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IReview {
  _id: string;
  productId: string;
  userId: string;
  user: {
    name: string;
    avatar?: string;
  };
  rating: number;
  title: string;
  body: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  size?: string;
  color?: string;
  flavor?: string;
  gender?: string;
  discount?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
}
