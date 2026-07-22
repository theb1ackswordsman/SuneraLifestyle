import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopLayout } from "@/components/layout/shop-layout";
import { ProductView } from "@/components/product/product-view";
import { queryProductBySlug, queryRelatedProducts } from "@/lib/shop/query-product";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product  = await queryProductBySlug(slug);
  if (!product) return { title: `Product Not Found — ${siteConfig.name}` };
  return {
    title:       `${product.name} — ${siteConfig.name}`,
    description: product.shortDescription ?? product.description.slice(0, 160),
    openGraph: {
      title:  product.name,
      images: product.images[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product  = await queryProductBySlug(slug);
  if (!product) notFound();

  const related = await queryRelatedProducts(product.category._id, slug, 6);

  return (
    <ShopLayout>
      <ProductView product={product} related={related} />
    </ShopLayout>
  );
}
