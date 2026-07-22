"use client";

import { useState, useEffect } from "react";
import { getCartCount } from "@/lib/cart-wishlist-store";

export function useCartCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getCartCount());
    const sync = () => setCount(getCartCount());
    window.addEventListener("sunera:cart-updated", sync);
    return () => window.removeEventListener("sunera:cart-updated", sync);
  }, []);

  return count;
}
