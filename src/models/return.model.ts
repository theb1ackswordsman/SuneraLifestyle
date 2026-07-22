import mongoose, { Document, Model, Schema } from "mongoose";

export const RETURN_STATUS = {
  REQUESTED:         "requested",
  UNDER_REVIEW:      "under_review",
  APPROVED:          "approved",
  REJECTED:          "rejected",
  REFUND_PROCESSING: "refund_processing",
  REFUND_COMPLETED:  "refund_completed",
} as const;
export type ReturnStatus = (typeof RETURN_STATUS)[keyof typeof RETURN_STATUS];

export const REFUND_STATUS = {
  PENDING:    "pending",
  PROCESSING: "processing",
  COMPLETED:  "completed",
  FAILED:     "failed",
} as const;
export type RefundStatus = (typeof REFUND_STATUS)[keyof typeof REFUND_STATUS];

export const RETURN_REASONS = [
  "wrong_size",
  "wrong_color",
  "damaged_product",
  "defective_product",
  "wrong_item",
  "missing_items",
  "quality_issue",
  "no_longer_needed",
  "other",
] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number];

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  wrong_size:       "Wrong Size",
  wrong_color:      "Wrong Color",
  damaged_product:  "Damaged Product",
  defective_product:"Defective Product",
  wrong_item:       "Wrong Item Received",
  missing_items:    "Missing Items",
  quality_issue:    "Quality Issue",
  no_longer_needed: "No Longer Needed",
  other:            "Other",
};

const returnTimelineSchema = new Schema(
  {
    status:      { type: String, required: true },
    message:     { type: String },
    timestamp:   { type: Date, default: Date.now },
    performedBy: { type: String, default: "system" },
  },
  { _id: false }
);

export interface IReturnDocument extends Document {
  returnNumber:  string;
  orderId:       mongoose.Types.ObjectId;
  orderNumber:   string;
  userId:        mongoose.Types.ObjectId;
  items:         Array<{ _id: string; name: string; image: string; price: number; quantity: number }>;
  orderTotal:    number;
  reason:        ReturnReason;
  description?:  string;
  images:        string[];
  video?:        string;
  status:        ReturnStatus;
  adminNote?:    string;
  timeline:      Array<{ status: string; message?: string; timestamp: Date; performedBy: string }>;
  refund: {
    amount?:          number;
    status?:          RefundStatus;
    method?:          string;
    gatewayRefundId?: string;
    failureReason?:   string;
    initiatedAt?:     Date;
    completedAt?:     Date;
    notes?:           string;
  };
  returnWindowExpiry: Date;
  deletedAt?:         Date;
  createdAt:          Date;
  updatedAt:          Date;
}

const returnSchema = new Schema<IReturnDocument>(
  {
    returnNumber:  { type: String, required: true, unique: true },
    orderId:       { type: Schema.Types.ObjectId, ref: "Order", required: true },
    orderNumber:   { type: String, required: true },
    userId:        { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [{
      _id:      { type: String, required: true },
      name:     { type: String, required: true },
      image:    { type: String, default: "" },
      price:    { type: Number, required: true },
      quantity: { type: Number, required: true },
    }],
    orderTotal:   { type: Number, required: true },
    reason:       { type: String, enum: RETURN_REASONS, required: true },
    description:  { type: String, maxlength: 1000 },
    images:       [{ type: String }],
    video:        { type: String },
    status:       { type: String, enum: Object.values(RETURN_STATUS), default: RETURN_STATUS.REQUESTED },
    adminNote:    { type: String },
    timeline:     { type: [returnTimelineSchema], default: [] },
    refund: {
      amount:          { type: Number },
      status:          { type: String, enum: Object.values(REFUND_STATUS) },
      method:          { type: String },
      gatewayRefundId: { type: String },
      failureReason:   { type: String },
      initiatedAt:     { type: Date },
      completedAt:     { type: Date },
      notes:           { type: String },
    },
    returnWindowExpiry: { type: Date, required: true },
    deletedAt:          { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => { delete ret.__v; return ret; },
    },
  }
);

returnSchema.index({ userId: 1, createdAt: -1 });
returnSchema.index({ orderId: 1 });
returnSchema.index({ status: 1 });
returnSchema.index({ returnNumber: 1 });

export const Return: Model<IReturnDocument> =
  mongoose.models.Return ?? mongoose.model<IReturnDocument>("Return", returnSchema);
