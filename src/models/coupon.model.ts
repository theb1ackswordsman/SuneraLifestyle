import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICouponDocument extends Document {
  code: string;
  type: "percentage" | "flat" | "free_shipping" | "bogo";
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  userLimit?: number;
  usedBy: mongoose.Types.ObjectId[];
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  applicableCategories: mongoose.Types.ObjectId[];
  applicableProducts: mongoose.Types.ObjectId[];
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICouponDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9_-]{3,20}$/, "Invalid coupon code format"],
    },
    type: {
      type: String,
      required: true,
      enum: ["percentage", "flat", "free_shipping", "bogo"],
    },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 },
    usageLimit: { type: Number, min: 1 },
    usageCount: { type: Number, default: 0 },
    userLimit: { type: Number, min: 1, default: 1 },
    usedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    description: { type: String, maxlength: 500 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_, ret: Record<string, unknown>) => { delete ret.__v; delete ret.usedBy; return ret; } },
  }
);

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, endDate: 1 });

export const Coupon: Model<ICouponDocument> =
  mongoose.models.Coupon ?? mongoose.model<ICouponDocument>("Coupon", couponSchema);
