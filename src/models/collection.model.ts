import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type CollectionType = "ethnic-wear" | "ayurvedic" | "mixed";
export type ProductAssignment = "manual" | "auto-tags" | "auto-category";

export interface ICollectionDocument extends Document {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnail: string;
  banner: string;
  badge: string;
  type: CollectionType;
  displayOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  productAssignment: ProductAssignment;
  manualProductIds: Types.ObjectId[];
  autoTags: string[];
  autoCategorySlug: string;
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<ICollectionDocument>(
  {
    name:             { type: String, required: [true, "Name is required"], trim: true, maxlength: 100 },
    slug:             { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, trim: true, maxlength: 200, default: "" },
    description:      { type: String, trim: true, maxlength: 1000, default: "" },
    thumbnail:        { type: String, default: "" },
    banner:           { type: String, default: "" },
    badge:            { type: String, trim: true, maxlength: 50, default: "" },
    type: {
      type: String,
      enum: ["ethnic-wear", "ayurvedic", "mixed"],
      default: "mixed",
    },
    displayOrder:       { type: Number, default: 0 },
    isActive:           { type: Boolean, default: true },
    isFeatured:         { type: Boolean, default: false },
    productAssignment: {
      type: String,
      enum: ["manual", "auto-tags", "auto-category"],
      default: "auto-tags",
    },
    manualProductIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    autoTags:         { type: [String], default: [] },
    autoCategorySlug: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => { delete ret.__v; return ret; },
    },
  }
);

collectionSchema.index({ isActive: 1, displayOrder: 1 });
collectionSchema.index({ type: 1, isActive: 1 });
collectionSchema.index({ isFeatured: 1, isActive: 1 });

export const Collection: Model<ICollectionDocument> =
  mongoose.models.Collection ??
  mongoose.model<ICollectionDocument>("Collection", collectionSchema);
