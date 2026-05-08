import { ClienteLayout } from "../../components/cliente/ClienteLayout";
import { ProductDetailClient } from "../../components/cliente/ProductDetailClient";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; index?: string; mesa?: string }>;
};

export default async function ProductDetailPage({
  params,
  searchParams,
}: ProductDetailPageProps) {
  const { id } = await params;
  const { from, mesa } = await searchParams;
  const backHref =
    from === "carrinho"
      ? mesa
        ? `/cliente/carrinho?mesa=${mesa}`
        : "/cliente/carrinho"
      : undefined;
  return (
    <ClienteLayout showBottomNav={false} backHref={backHref}>
      <ProductDetailClient productId={id} />
    </ClienteLayout>
  );
}
