import mongoose, { Document, Model, Schema } from "mongoose";

export const REVIEW_STATUS = {
  PENDING:  "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  HIDDEN:   "hidden",
} as const;
export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];

export const REJECTION_REASONS = [
  "spam", "offensive_language", "fake_review",
  "duplicate_review", "irrelevant_content", "other",
] as const;
export type RejectionReason = (typeof REJECTION_REASONS)[number];

export const REPORT_REASONS = [
  "spam", "offensive_language", "fake_review",
  "misleading_information", "harassment", "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  spam:               "Spam",
  offensive_language: "Offensive Language",
  fake_review:        "Fake Review",
  duplicate_review:   "Duplicate Review",
  irrelevant_content: "Irrelevant Content",
  other:              "Other",
};

export interface IReviewDocument extends Document {
  productId:        mongoose.Types.ObjectId;
  orderId?:         mongoose.Types.ObjectId;
  customerId?:      mongoose.Types.ObjectId;
  rating:           number;
  title?:           string;
  body:             string;
  images:           string[];
  video?:           string;
  status:           ReviewStatus;
  verifiedPurchase: boolean;
  adminAdded:       boolean;
  adminAddedName?:  string;
  helpfulCount:     number;
  helpfulBy:        mongoose.Types.ObjectId[];
  reportCount:      number;
  reports:          { userId: mongoose.Types.ObjectId; reason: string; createdAt: Date }[];
  rejectionReason?: string;
  adminNote?:       string;
  deletedAt?:       Date;
  createdAt:        Date;
  updatedAt:        Date;
}

const reportSchema = new Schema(
  {
    userId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason:    { type: String, enum: [...REPORT_REASONS], required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const reviewSchema = new Schema<IReviewDocument>(
  {
    productId:        { type: Schema.Types.ObjectId, ref: "Product", required: true },
    orderId:          { type: Schema.Types.ObjectId, ref: "Order" },
    customerId:       { type: Schema.Types.ObjectId, ref: "User" },
    rating:           { type: Number, required: true, min: 1, max: 5 },
    title:            { type: String, trim: true, maxlength: 200 },
    body:             { type: String, required: true, trim: true, maxlength: 2000 },
    images:           { type: [String], default: [] },
    video:            { type: String },
    status:           { type: String, enum: Object.values(REVIEW_STATUS), default: REVIEW_STATUS.PENDING },
    verifiedPurchase: { type: Boolean, default: false },
    adminAdded:       { type: Boolean, default: false },
    adminAddedName:   { type: String, trim: true },
    helpfulCount:     { type: Number, default: 0, min: 0 },
    helpfulBy:        { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    reportCount:      { type: Number, default: 0, min: 0 },
    reports:          { type: [reportSchema], default: [] },
    rejectionReason:  { type: String, enum: [...REJECTION_REASONS, null] },
    adminNote:        { type: String, maxlength: 1000 },
    deletedAt:        { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_: unknown, ret: Record<string, unknown>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ customerId: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ reportCount: -1 });
reviewSchema.index(
  { productId: 1, customerId: 1 },
  {
    unique: true,
    partialFilterExpression: { customerId: { $exists: true }, adminAdded: false },
  }
);

export const Review: Model<IReviewDocument> =
  mongoose.models.Review ?? mongoose.model<IReviewDocument>("Review", reviewSchema);
