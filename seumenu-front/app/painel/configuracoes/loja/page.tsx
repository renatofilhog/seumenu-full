import { PageShell } from "../../../components/dashboard/PageShell";
import { StoreClient } from "./storeClient";

export default function StorePage() {
  return (
    <PageShell title="Configuracoes da Loja">
      <StoreClient />
    </PageShell>
  );
}
