import { Suspense } from "react";
import { CartClient } from "../../components/cliente/CartClient";
import { ClienteLayout } from "../../components/cliente/ClienteLayout";

export default function ClienteCarrinhoPage() {
  return (
    <ClienteLayout title="Pedido" active="carrinho">
      <Suspense fallback={null}>
        <CartClient />
      </Suspense>
    </ClienteLayout>
  );
}
