import type { Metadata } from "next";
import { ShopLayout } from "@/components/layout/shop-layout";
import { CartView } from "@/components/cart/cart-view";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Shopping Cart — ${siteConfig.name}`,
  description: "Review the items in your cart and proceed to a secure checkout.",
};

export default function CartPage() {
  return (
    <ShopLayout>
      <CartView />
    </ShopLayout>
  );
}
