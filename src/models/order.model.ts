import mongoose, { Document, Model, Schema } from "mongoose";
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS, OrderStatus, PaymentStatus, PaymentMethod } from "@/constants";

const addressEmbedSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
    type: { type: String, enum: ["home", "work", "other"], default: "home" },
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String },
    name: { type: String, required: true },
    image: { type: String, required: true },
    slug: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    variant: {
      size: String,
      color: String,
      flavor: String,
      weight: String,
    },
  },
  { _id: true }
);

const timelineSchema = new Schema(
  {
    status: { type: String, enum: Object.values(ORDER_STATUS), required: true },
    timestamp: { type: Date, default: Date.now },
    message: { type: String },
  },
  { _id: false }
);

export interface IOrderDocument extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  items: mongoose.Types.DocumentArray<mongoose.Types.Subdocument>;
  shippingAddress: Record<string, unknown>;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  couponCode?: string;
  couponDiscount?: number;
  giftMessage?: string;
  isGiftWrapped: boolean;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  notes?: string;
  timeline: { status: OrderStatus; timestamp: Date; message?: string }[];
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  invoiceUrl?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: addressEmbedSchema, required: true },
    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING },
    paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },
    paymentMethod: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    giftMessage: { type: String, maxlength: 500 },
    isGiftWrapped: { type: Boolean, default: false },
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    estimatedDelivery: { type: Date },
    notes: { type: String },
    timeline: { type: [timelineSchema], default: [] },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    invoiceUrl: { type: String },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_, ret: Record<string, unknown>) => { delete ret.__v; return ret; } },
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

export const Order: Model<IOrderDocument> =
  mongoose.models.Order ?? mongoose.model<IOrderDocument>("Order", orderSchema);
