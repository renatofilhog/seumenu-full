import { PageShell } from "../../components/dashboard/PageShell";
import { MesasClient } from "./MesasClient";

export default function MesasPage() {
  return (
    <PageShell title="Mesas">
      <MesasClient />
    </PageShell>
  );
}
