import { OrderStatus, PaymentMethod, PaymentStatus } from "@/constants";

export interface IAddress {
  _id?: string;
  userId?: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
  type?: "home" | "work" | "other";
}

export interface ICartItem {
  productId: string;
  variantSku?: string;
  quantity: number;
  product?: {
    name: string;
    slug: string;
    image: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    variant?: {
      size?: string;
      color?: string;
      flavor?: string;
      weight?: string;
    };
  };
}

export interface ICart {
  _id: string;
  userId?: string;
  sessionId?: string;
  items: ICartItem[];
  couponCode?: string;
  couponDiscount?: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface IOrderItem {
  productId: string;
  variantSku?: string;
  name: string;
  image: string;
  slug: string;
  price: number;
  quantity: number;
  variant?: {
    size?: string;
    color?: string;
    flavor?: string;
    weight?: string;
  };
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  userId: string;
  items: IOrderItem[];
  shippingAddress: IAddress;
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
  isGiftWrapped?: boolean;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  notes?: string;
  timeline: {
    status: OrderStatus;
    timestamp: string;
    message?: string;
  }[];
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  invoiceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICoupon {
  _id: string;
  code: string;
  type: "percentage" | "flat" | "free_shipping" | "bogo";
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  userLimit?: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IWishlist {
  _id: string;
  userId: string;
  products: string[];
  createdAt: string;
  updatedAt: string;
}
