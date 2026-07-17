import type { Metadata } from "next";
import { ShopLayout } from "@/components/layout/shop-layout";
import { WishlistView } from "@/components/wishlist/wishlist-view";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `My Wishlist — ${siteConfig.name}`,
  description: "The products you've saved for later.",
};

export default function WishlistPage() {
  return (
    <ShopLayout>
      <WishlistView />
    </ShopLayout>
  );
}
