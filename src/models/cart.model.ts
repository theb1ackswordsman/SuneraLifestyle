import mongoose, { Document, Model, Schema } from "mongoose";

const cartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String },
    quantity: { type: Number, required: true, min: 1, max: 100 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

export interface ICartDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  items: mongoose.Types.DocumentArray<mongoose.Types.Subdocument>;
  couponCode?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema = new Schema<ICartDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", sparse: true },
    sessionId: { type: String, sparse: true },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  { timestamps: true, toJSON: { virtuals: true, transform: (_, ret: Record<string, unknown>) => { delete ret.__v; return ret; } } }
);

cartSchema.index({ userId: 1 }, { sparse: true });
cartSchema.index({ sessionId: 1 }, { sparse: true });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Cart: Model<ICartDocument> =
  mongoose.models.Cart ?? mongoose.model<ICartDocument>("Cart", cartSchema);
