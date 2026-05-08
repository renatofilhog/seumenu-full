import { Suspense } from "react";
import { PageShell } from "../../../components/dashboard/PageShell";
import { CardapioClient } from "./CardapioClient";

export default function ProdutosPage() {
  return (
    <PageShell title="Cardapio">
      <Suspense fallback={null}>
        <CardapioClient />
      </Suspense>
    </PageShell>
  );
}
