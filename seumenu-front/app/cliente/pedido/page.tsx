import { ClienteLayout } from "../../components/cliente/ClienteLayout";
import { OrderTrackingClient } from "../../components/cliente/OrderTrackingClient";

export default function ClientePedidoPage() {
  return (
    <ClienteLayout title="Acompanhamento do pedido" active="pedido">
      <OrderTrackingClient />
    </ClienteLayout>
  );
}
