"use client";

import { useState, useEffect } from "react";
import { getWishlistCount } from "@/lib/cart-wishlist-store";

export function useWishlistCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getWishlistCount());
    const sync = () => setCount(getWishlistCount());
    window.addEventListener("sunera:wishlist-updated", sync);
    return () => window.removeEventListener("sunera:wishlist-updated", sync);
  }, []);

  return count;
}
