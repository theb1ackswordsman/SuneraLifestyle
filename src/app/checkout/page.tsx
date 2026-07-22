import type { Metadata } from "next";
import { ShopLayout } from "@/components/layout/shop-layout";
import { CheckoutContent } from "./_content";

export const metadata: Metadata = {
  title: "Checkout — SunEra Lifestyle",
};

export default function CheckoutPage() {
  return (
    <ShopLayout>
      <CheckoutContent />
    </ShopLayout>
  );
}
