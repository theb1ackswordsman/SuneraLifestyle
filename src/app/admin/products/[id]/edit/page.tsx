import ProductForm from "../../_form/product-form";

interface Props { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  return <ProductForm productId={id} />;
}
