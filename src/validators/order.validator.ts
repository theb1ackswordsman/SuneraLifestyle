import { z } from "zod";
import { PAYMENT_METHODS } from "@/constants";

const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid PIN code"),
  country: z.string().default("India"),
  type: z.enum(["home", "work", "other"]).default("home"),
});

export const createOrderSchema = z.object({
  shippingAddress: addressSchema,
  paymentMethod: z.enum([PAYMENT_METHODS.RAZORPAY, PAYMENT_METHODS.COD, PAYMENT_METHODS.STRIPE]),
  couponCode: z.string().optional(),
  giftMessage: z.string().max(500).optional(),
  isGiftWrapped: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export const createAddressSchema = addressSchema.extend({
  isDefault: z.boolean().default(false),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  orderAmount: z.number().min(0),
});

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantSku: z.string().optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(100),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, "Quantity cannot be negative").max(100),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().min(2, "Review title is required").max(100),
  body: z.string().min(10, "Review must be at least 10 characters").max(2000),
  images: z.array(z.string()).max(5).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
