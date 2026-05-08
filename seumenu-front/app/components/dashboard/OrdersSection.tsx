import Link from "next/link";
import { pedidos as pedidosFallback } from "./data";

export type PedidoDisplay = {
  id: string;
  mesa: string;
  valor: string;
  status: string;
  hora: string;
};

type OrdersSectionProps = {
  pedidos?: PedidoDisplay[];
};

export function OrdersSection({ pedidos }: OrdersSectionProps) {
  const pedidosData = pedidos === undefined ? pedidosFallback : pedidos;

  return (
    <div className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-[color:var(--color-gray-800)]">
            Listagem de Pedidos
          </h3>
          <p className="text-xs font-bold text-[color:var(--color-gray-500)]">
            Acompanhe itens e atualize o status do pedido.
          </p>
        </div>
        <Link
          href="/painel/pedido"
          className="rounded-full border border-[color:var(--color-blue-800)]/20 px-4 py-2 text-xs font-extrabold text-[color:var(--color-blue-800)]"
        >
          Exportar
        </Link>
      </div>
      <div className="mt-5 space-y-3">
        {pedidosData.length === 0 ? (
          <div className="rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] px-4 py-6 text-center text-xs font-bold text-[color:var(--color-gray-500)] shadow-[var(--shadow-soft)]">
            Nenhum pedido registrado hoje.
          </div>
        ) : (
          pedidosData.map((pedido) => (
          <div
            key={pedido.id}
            className="grid gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] p-4 text-xs shadow-[var(--shadow-soft)] md:grid-cols-[0.9fr_0.8fr_0.7fr_0.6fr_0.5fr]"
          >
            <div>
              <p className="font-extrabold text-[color:var(--color-gray-800)]">
                {pedido.id}
              </p>
              <p className="font-bold text-[color:var(--color-gray-500)]">
                {pedido.hora}
              </p>
            </div>
            <div className="font-extrabold text-[color:var(--color-gray-800)]">
              {pedido.mesa}
            </div>
            <div className="font-bold text-[color:var(--color-gray-500)]">
              {pedido.valor}
            </div>
            <div className="rounded-full bg-[color:var(--color-green-100)] px-3 py-1 text-center font-bold text-[color:var(--color-gray-800)]">
              {pedido.status}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/painel/pedido"
                className="rounded-full bg-[color:var(--color-white)] px-3 py-1 font-bold text-[color:var(--color-blue-800)] shadow-[var(--shadow-soft)]"
              >
                Itens
              </Link>
              <Link
                href="/painel/pedido"
                className="rounded-full bg-[color:var(--color-blue-50)] px-3 py-1 font-bold text-[color:var(--color-blue-800)]"
              >
                Status
              </Link>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
}
