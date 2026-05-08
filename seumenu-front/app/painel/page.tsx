import { PageShell } from "../components/dashboard/PageShell";
import { ResumoClient } from "../components/dashboard/ResumoClient";

export default function Home() {
  return (
    <PageShell title="Resumo">
      <ResumoClient />
    </PageShell>
  );
}
