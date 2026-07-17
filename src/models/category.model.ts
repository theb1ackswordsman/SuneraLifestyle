import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: mongoose.Types.ObjectId;
  isActive: boolean;
  order: number;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  productCount: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, maxlength: 1000 },
    image: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: "Category" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    seo: {
      title: { type: String, maxlength: 70 },
      description: { type: String, maxlength: 160 },
      keywords: [{ type: String }],
    },
    productCount: { type: Number, default: 0 },
    deletedAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true, transform: (_, ret: Record<string, unknown>) => { delete ret.__v; return ret; } } }
);

categorySchema.index({ parentId: 1 });
categorySchema.index({ isActive: 1, order: 1 });

export const Category: Model<ICategoryDocument> =
  mongoose.models.Category ?? mongoose.model<ICategoryDocument>("Category", categorySchema);
