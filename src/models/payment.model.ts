import mongoose, { Document, Model, Schema } from "mongoose";

// ── Types ──────────────────────────────────────────────────────────────────

export type PaymentRecordStatus =
  | "pending"
  | "success"
  | "failed"
  | "pending_verification"
  | "refunded";

export interface IPaymentAttempt {
  attemptedAt: Date;
  source: "client" | "webhook" | "admin";
  gatewayPaymentId?: string;
  signature?: string;
  status: string;
  note?: string;
  raw?: Record<string, unknown>;
}

export interface IPaymentLog {
  action: string;
  performedBy: "system" | "webhook" | "admin" | "customer";
  performedById?: mongoose.Types.ObjectId;
  note?: string;
  at: Date;
}

export interface IAdminNote {
  _id?: unknown;
  note: string;
  createdAt: Date;
  createdBy?: string;
}

export interface IPaymentDocument extends Document {
  paymentRef: string;                          // PAY-XXXXXXXXX (internal reference)
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  amount: number;                              // in INR (rupees)
  currency: string;
  paymentMethod: string;                       // "razorpay" | "cod"
  gatewayName: string;
  gatewayOrderId?: string;                     // Razorpay: order_XXXX
  gatewayPaymentId?: string;                   // Razorpay: pay_XXXX
  transactionRef?: string;                     // Bank reference number (from webhook)
  status: PaymentRecordStatus;
  signature?: string;                          // client-submitted HMAC signature
  webhookReceived: boolean;
  webhookPayload?: Record<string, unknown>;    // raw webhook body from gateway
  gatewayResponse?: Record<string, unknown>;   // response from gateway API fetch
  adminVerifiedById?: mongoose.Types.ObjectId;
  adminVerifiedAt?: Date;
  adminNote?: string;
  adminNotes?: IAdminNote[];
  attempts: IPaymentAttempt[];
  logs: IPaymentLog[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ─────────────────────────────────────────────────────────────────

const attemptSchema = new Schema<IPaymentAttempt>(
  {
    attemptedAt:      { type: Date, default: Date.now },
    source:           { type: String, enum: ["client", "webhook", "admin"], required: true },
    gatewayPaymentId: { type: String },
    signature:        { type: String },
    status:           { type: String, required: true },
    note:             { type: String },
    raw:              { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const logSchema = new Schema<IPaymentLog>(
  {
    action:        { type: String, required: true },
    performedBy:   { type: String, enum: ["system", "webhook", "admin", "customer"], required: true },
    performedById: { type: Schema.Types.ObjectId, ref: "User" },
    note:          { type: String },
    at:            { type: Date, default: Date.now },
  },
  { _id: false }
);

const adminNoteSchema = new Schema<IAdminNote>(
  {
    note:      { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, default: "Admin" },
  },
  { _id: true }
);

const paymentSchema = new Schema<IPaymentDocument>(
  {
    paymentRef:       { type: String, required: true, unique: true },
    orderId:          { type: Schema.Types.ObjectId, ref: "Order", required: true },
    orderNumber:      { type: String, required: true },
    userId:           { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount:           { type: Number, required: true, min: 0 },
    currency:         { type: String, default: "INR" },
    paymentMethod:    { type: String, required: true },
    gatewayName:      { type: String, required: true },
    gatewayOrderId:   { type: String },
    gatewayPaymentId: { type: String },
    transactionRef:   { type: String },
    status: {
      type:    String,
      enum:    ["pending", "success", "failed", "pending_verification", "refunded"],
      default: "pending",
    },
    signature:          { type: String },
    webhookReceived:    { type: Boolean, default: false },
    webhookPayload:     { type: Schema.Types.Mixed },
    gatewayResponse:    { type: Schema.Types.Mixed },
    adminVerifiedById:  { type: Schema.Types.ObjectId, ref: "User" },
    adminVerifiedAt:    { type: Date },
    adminNote:          { type: String },
    adminNotes:         { type: [adminNoteSchema], default: [] },
    attempts:           { type: [attemptSchema], default: [] },
    logs:               { type: [logSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => { delete ret.__v; return ret; },
    },
  }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ gatewayOrderId: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

export const Payment: Model<IPaymentDocument> =
  mongoose.models.Payment ?? mongoose.model<IPaymentDocument>("Payment", paymentSchema);
