export const ROUTES = {
  // Public
  HOME: "/",
  SHOP: "/shop",
  SUPPLEMENTS: "/shop?category=supplements",
  CLOTHING: "/shop?category=clothing",
  SEARCH: "/search",
  ABOUT: "/about",
  CONTACT: "/contact",
  BLOGS: "/blogs",
  TRACK_ORDER: "/track-order",
  WISHLIST: "/wishlist",
  CART: "/cart",

  // Collections
  COLLECTIONS: "/shop?type=collection",
  BUNDLES: "/shop?type=bundle",
  OFFERS: "/shop?discount=true",
  BEST_SELLERS: "/shop?sort=best-selling",
  NEW_ARRIVALS: "/shop?sort=newest",

  // Legal
  PRIVACY_POLICY: "/privacy-policy",
  REFUND_POLICY: "/refund-policy",
  SHIPPING_POLICY: "/shipping-policy",
  TERMS: "/terms-and-conditions",

  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",

  // Checkout
  CHECKOUT: "/checkout",
  CHECKOUT_SUCCESS: "/checkout/success",
  CHECKOUT_FAILURE: "/checkout/failure",

  // Account
  ACCOUNT: "/account",
  ACCOUNT_ORDERS: "/account/orders",
  ACCOUNT_WISHLIST: "/account/wishlist",
  ACCOUNT_ADDRESSES: "/account/addresses",
  ACCOUNT_PROFILE: "/account/profile",
  ACCOUNT_SECURITY: "/account/security",
  ACCOUNT_REVIEWS: "/account/reviews",
  ACCOUNT_SUPPORT: "/account/support",

  // Admin
  ADMIN_LOGIN: "/admin/login",
  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_PRODUCTS: "/admin/products",
  ADMIN_ORDERS: "/admin/orders",
  ADMIN_CUSTOMERS: "/admin/customers",
  ADMIN_CATEGORIES: "/admin/categories",
  ADMIN_COUPONS: "/admin/coupons",
  ADMIN_REVIEWS: "/admin/reviews",
  ADMIN_BLOGS: "/admin/blogs",
  ADMIN_ANALYTICS: "/admin/analytics",
  ADMIN_INVENTORY: "/admin/inventory",
  ADMIN_SETTINGS: "/admin/settings",

  // API
  API: {
    AUTH: {
      LOGIN: "/api/auth/login",
      REGISTER: "/api/auth/register",
      LOGOUT: "/api/auth/logout",
      REFRESH: "/api/auth/refresh",
      ME: "/api/auth/me",
      FORGOT_PASSWORD: "/api/auth/forgot-password",
      RESET_PASSWORD: "/api/auth/reset-password",
      VERIFY_EMAIL: "/api/auth/verify-email",
      ADMIN_VERIFY: "/api/auth/admin-verify",
    },
    PRODUCTS: "/api/products",
    CATEGORIES: "/api/categories",
    CART: "/api/cart",
    WISHLIST: "/api/wishlist",
    ORDERS: "/api/orders",
    SEARCH: "/api/search",
    UPLOAD: "/api/upload",
    COUPONS_VALIDATE: "/api/coupons/validate",
  },
} as const;
