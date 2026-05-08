import { ClienteLayout } from "./components/cliente/ClienteLayout";
import { ClienteHome } from "./components/cliente/ClienteHome";

export default function ClientePage() {
  return (
    <ClienteLayout active="home" showBackButton={false}>
      <ClienteHome />
    </ClienteLayout>
  );
}
