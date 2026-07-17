import mongoose, { Document, Model, Schema } from "mongoose";

export interface IWishlistDocument extends Document {
  userId: mongoose.Types.ObjectId;
  products: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlistDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true, toJSON: { virtuals: true, transform: (_, ret: Record<string, unknown>) => { delete ret.__v; return ret; } } }
);

wishlistSchema.index({ userId: 1 });

export const Wishlist: Model<IWishlistDocument> =
  mongoose.models.Wishlist ?? mongoose.model<IWishlistDocument>("Wishlist", wishlistSchema);
