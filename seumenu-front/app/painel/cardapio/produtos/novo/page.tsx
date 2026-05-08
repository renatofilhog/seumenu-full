import { PageShell } from "../../../../components/dashboard/PageShell";
import { ProductFormClient } from "../ProductFormClient";

export default function NovoProdutoPage() {
  return (
    <PageShell title="Novo produto">
      <ProductFormClient />
    </PageShell>
  );
}
