import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopLayout } from "@/components/layout/shop-layout";
import { ProductView } from "@/components/product/product-view";
import { MOCK_PRODUCTS } from "@/data/mock/homepage";
import { siteConfig } from "@/config/site";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return MOCK_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug);
  if (!product) return { title: `Product Not Found — ${siteConfig.name}` };
  return {
    title: `${product.name} — ${siteConfig.name}`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug);

  if (!product) notFound();

  const related = MOCK_PRODUCTS.filter((p) => p.slug !== slug).slice(0, 4);

  return (
    <ShopLayout>
      <ProductView product={product} related={related} />
    </ShopLayout>
  );
}
