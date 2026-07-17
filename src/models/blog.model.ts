import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBlogDocument extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: mongoose.Types.ObjectId;
  categories: string[];
  tags: string[];
  status: "draft" | "published" | "archived";
  readingTime: number;
  viewCount: number;
  seo: { title?: string; description?: string; keywords?: string[] };
  publishedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlogDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true, maxlength: 300 },
    content: { type: String, required: true },
    coverImage: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    categories: [{ type: String, trim: true }],
    tags: [{ type: String, lowercase: true, trim: true }],
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    readingTime: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    seo: {
      title: { type: String, maxlength: 70 },
      description: { type: String, maxlength: 160 },
      keywords: [{ type: String }],
    },
    publishedAt: { type: Date },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_, ret: Record<string, unknown>) => { delete ret.__v; return ret; } },
  }
);

blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ categories: 1 });
blogSchema.index({ title: "text", content: "text", tags: "text" });

export const Blog: Model<IBlogDocument> =
  mongoose.models.Blog ?? mongoose.model<IBlogDocument>("Blog", blogSchema);
