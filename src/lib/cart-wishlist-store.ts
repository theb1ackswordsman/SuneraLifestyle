// Client-side cart & wishlist store backed by localStorage.
// Fires custom window events so any hook can react without a global provider.

const CART_KEY     = "sunera_cart";
const WISHLIST_KEY = "sunera_wishlist";

// ── helpers ────────────────────────────────────────────────────────────────

export interface CartItemEntry {
  productId: string;
  qty: number;
  selectedSize?: string;
  selectedColor?: string;
}

function readCart(): Record<string, CartItemEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) ?? "{}");
    const normalized: Record<string, CartItemEntry> = {};

    for (const [key, val] of Object.entries(raw)) {
      if (typeof val === "number") {
        const [pId, sz] = key.split(":");
        normalized[key] = { productId: pId, qty: val, selectedSize: sz };
      } else if (typeof val === "object" && val !== null) {
        normalized[key] = val as CartItemEntry;
      }
    }
    return normalized;
  } catch {
    return {};
  }
}

function writeCart(data: Record<string, CartItemEntry>) {
  localStorage.setItem(CART_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("sunera:cart-updated"));
}

function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? "[]"); } catch { return []; }
}

function writeWishlist(items: string[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("sunera:wishlist-updated"));
}

// ── cart ──────────────────────────────────────────────────────────────────

export function getCartCount(): number {
  return Object.values(readCart()).reduce((s, item) => s + (item.qty ?? 0), 0);
}

export function getCartItems(): { key: string; productId: string; qty: number; selectedSize?: string; selectedColor?: string }[] {
  return Object.entries(readCart()).map(([key, item]) => ({
    key,
    productId: item.productId,
    qty: item.qty,
    selectedSize: item.selectedSize,
    selectedColor: item.selectedColor,
  }));
}

export function addToCart(productId: string, qty = 1, selectedSize?: string, selectedColor?: string): void {
  const cart = readCart();
  const variantTag = [selectedSize, selectedColor].filter(Boolean).join(" / ");
  const key = variantTag ? `${productId}:${variantTag}` : productId;

  if (cart[key]) {
    cart[key].qty += qty;
  } else {
    cart[key] = { productId, qty, selectedSize: variantTag || undefined, selectedColor };
  }
  writeCart(cart);
}

export function setCartQty(key: string, qty: number): void {
  const cart = readCart();
  if (qty <= 0) {
    delete cart[key];
  } else if (cart[key]) {
    cart[key].qty = qty;
  }
  writeCart(cart);
}

export function removeFromCart(key: string): void {
  const cart = readCart();
  delete cart[key];
  writeCart(cart);
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("sunera:cart-updated"));
}

// ── wishlist ──────────────────────────────────────────────────────────────

export function getWishlistCount(): number {
  return readWishlist().length;
}

export function getWishlistIds(): string[] {
  return readWishlist();
}

export function isWishlisted(productId: string): boolean {
  return readWishlist().includes(productId);
}

export function toggleWishlist(productId: string): boolean {
  const items = readWishlist();
  const idx   = items.indexOf(productId);
  const added = idx === -1;
  if (added) items.push(productId); else items.splice(idx, 1);
  writeWishlist(items);
  return added;
}

export function removeFromWishlist(productId: string): void {
  const items = readWishlist().filter((id) => id !== productId);
  writeWishlist(items);
}
