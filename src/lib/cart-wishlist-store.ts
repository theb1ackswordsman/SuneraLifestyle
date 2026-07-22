// Client-side cart & wishlist store backed by localStorage.
// Fires custom window events so any hook can react without a global provider.

const CART_KEY     = "sunera_cart";
const WISHLIST_KEY = "sunera_wishlist";

// ── helpers ────────────────────────────────────────────────────────────────

function readCart(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(CART_KEY) ?? "{}"); } catch { return {}; }
}

function writeCart(data: Record<string, number>) {
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
  return Object.values(readCart()).reduce((s, q) => s + q, 0);
}

export function getCartItems(): { productId: string; qty: number }[] {
  return Object.entries(readCart()).map(([productId, qty]) => ({ productId, qty }));
}

export function addToCart(productId: string, qty = 1): void {
  const cart = readCart();
  cart[productId] = (cart[productId] ?? 0) + qty;
  writeCart(cart);
}

export function setCartQty(productId: string, qty: number): void {
  const cart = readCart();
  if (qty <= 0) delete cart[productId];
  else cart[productId] = qty;
  writeCart(cart);
}

export function removeFromCart(productId: string): void {
  const cart = readCart();
  delete cart[productId];
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
