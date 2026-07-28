import type { Metadata } from "next";
import { ShopLayout } from "@/components/layout/shop-layout";
import { CheckoutContent } from "./_content";

export const metadata: Metadata = {
  title: "Checkout — SunEra Lifestyle",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ buyNow?: string; qty?: string; size?: string }>;
}) {
  const params = await searchParams;
  const buyNowProductId = params.buyNow;
  const buyNowQty = params.qty ? Math.max(1, parseInt(params.qty, 10)) : 1;
  const buyNowSize = params.size;

  return (
    <ShopLayout>
      <CheckoutContent buyNowProductId={buyNowProductId} buyNowQty={buyNowQty} buyNowSize={buyNowSize} />
    </ShopLayout>
  );
}
