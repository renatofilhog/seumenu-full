import { PageShell } from "../../../../components/dashboard/PageShell";
import { ProductFormClient } from "../ProductFormClient";

type ProductEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProdutoEditPage({
  params,
}: ProductEditPageProps) {
  const { id } = await params;
  return (
    <PageShell title="Editar produto">
      <ProductFormClient productId={id} />
    </PageShell>
  );
}
