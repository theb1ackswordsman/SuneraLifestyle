import mongoose, { Document, Model, Schema } from "mongoose";

const variantSchema = new Schema(
  {
    sku: { type: String, required: true, trim: true },
    size: { type: String },
    color: { type: String },
    colorHex: { type: String },
    flavor: { type: String },
    weight: { type: String },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String }],
  },
  { _id: true }
);

const nutritionFactSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
    dailyValue: { type: String },
  },
  { _id: false }
);

export interface IProductDocument extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: mongoose.Types.ObjectId;
  subcategory?: string;
  brand?: string;
  sku: string;
  barcode?: string;
  images: string[];
  videos?: string[];
  variants: mongoose.Types.DocumentArray<mongoose.Types.Subdocument & {
    sku: string; size?: string; color?: string; colorHex?: string;
    flavor?: string; weight?: string; price: number; compareAtPrice?: number;
    stock: number; images?: string[];
  }>;
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
  nutritionFacts?: { label: string; value: string; dailyValue?: string }[];
  directions?: string;
  warnings?: string;
  manufacturingDetails?: string;
  expiryMonths?: number;
  certificates?: string[];
  shippingDetails?: string;
  returnPolicy?: string;
  seo: { title?: string; description?: string; keywords?: string[] };
  reviewSummary: { average: number; count: number; distribution: { star: number; count: number }[] };
  salesCount: number;
  viewCount: number;
  gender?: string;
  relatedProducts?: mongoose.Types.ObjectId[];
  frequentlyBoughtWith?: mongoose.Types.ObjectId[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 300 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 500 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subcategory: { type: String },
    brand: { type: String, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    barcode: { type: String },
    images: { type: [String], required: true },
    videos: [{ type: String }],
    variants: { type: [variantSchema], default: [] },
    basePrice: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: true },
    isBestSeller: { type: Boolean, default: false },
    tags: [{ type: String, lowercase: true }],
    benefits: [{ type: String }],
    ingredients: [{ type: String }],
    nutritionFacts: [nutritionFactSchema],
    directions: { type: String },
    warnings: { type: String },
    manufacturingDetails: { type: String },
    expiryMonths: { type: Number, min: 1 },
    certificates: [{ type: String }],
    shippingDetails: { type: String },
    returnPolicy: { type: String },
    seo: {
      title: { type: String, maxlength: 70 },
      description: { type: String, maxlength: 160 },
      keywords: [{ type: String }],
    },
    reviewSummary: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
      distribution: {
        type: [{ star: Number, count: Number }],
        default: [
          { star: 5, count: 0 }, { star: 4, count: 0 }, { star: 3, count: 0 },
          { star: 2, count: 0 }, { star: 1, count: 0 },
        ],
      },
    },
    salesCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    gender: { type: String, enum: ["men", "women", "unisex"] },
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    frequentlyBoughtWith: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_, ret: Record<string, unknown>) => { delete ret.__v; return ret; } },
  }
);

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ "reviewSummary.average": -1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ isBestSeller: 1, isActive: 1 });
productSchema.index({ isNewArrival: 1, isActive: 1, createdAt: -1 });
productSchema.index({ name: "text", description: "text", tags: "text", brand: "text" });

export const Product: Model<IProductDocument> =
  mongoose.models.Product ?? mongoose.model<IProductDocument>("Product", productSchema);
