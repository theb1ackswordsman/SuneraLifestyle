export * from "./routes";
export * from "./product";

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  ADMIN_LIMIT: 25,
  BLOG_LIMIT: 9,
  REVIEW_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Cookie names
export const COOKIES = {
  ACCESS_TOKEN: "sunera_access_token",
  REFRESH_TOKEN: "sunera_refresh_token",
  CART_ID: "sunera_cart_id",
  THEME: "sunera_theme",
  RECENTLY_VIEWED: "sunera_recently_viewed",
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: "admin",
  CUSTOMER: "customer",
  MODERATOR: "moderator",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Order statuses
export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PACKED: "packed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURNED: "returned",
  REFUNDED: "refunded",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

// Payment methods
export const PAYMENT_METHODS = {
  RAZORPAY: "razorpay",
  STRIPE: "stripe",
  COD: "cod",
  WALLET: "wallet",
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

// Sort options
export const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Best Selling", value: "best-selling" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Top Rated", value: "rating" },
  { label: "Most Popular", value: "popular" },
] as const;

// Star ratings
export const RATING_OPTIONS = [5, 4, 3, 2, 1] as const;

// Image upload config
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"],
  MAX_IMAGES_PER_PRODUCT: 10,
  CLOUDINARY_FOLDER: "sunera",
} as const;

// Toast messages
export const TOAST_MESSAGES = {
  ADDED_TO_CART: "Added to cart!",
  REMOVED_FROM_CART: "Removed from cart",
  ADDED_TO_WISHLIST: "Saved to wishlist",
  REMOVED_FROM_WISHLIST: "Removed from wishlist",
  LOGIN_SUCCESS: "Welcome back!",
  LOGOUT_SUCCESS: "Logged out successfully",
  REGISTER_SUCCESS: "Account created! Please verify your email.",
  ORDER_PLACED: "Order placed successfully!",
  COPIED: "Copied to clipboard!",
} as const;
