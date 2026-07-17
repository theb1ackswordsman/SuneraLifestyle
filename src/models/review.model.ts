import mongoose, { Document, Model, Schema } from "mongoose";

export interface IReviewDocument extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  rating: number;
  title: string;
  body: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  votedUsers: mongoose.Types.ObjectId[];
  isApproved: boolean;
  isReported: boolean;
  reportCount: number;
  adminNote?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReviewDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    images: [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulVotes: { type: Number, default: 0 },
    votedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isApproved: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    adminNote: { type: String },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_, ret: Record<string, unknown>) => { delete ret.__v; delete ret.votedUsers; return ret; } },
  }
);

reviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ isApproved: 1 });
// One review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

export const Review: Model<IReviewDocument> =
  mongoose.models.Review ?? mongoose.model<IReviewDocument>("Review", reviewSchema);
