import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AUTH_TOKEN_COOKIE, ApiRequestError, apiGet } from "../../../lib/api";

type Mesa = {
  numero: number;
  setor: string;
};

type PedidoItem = {
  id: number;
  qtSolicitada: number;
  valorUnit: string;
  produto?: { nome?: string };
  additionals?: { nome?: string }[];
  observacao?: string;
};

type Pedido = {
  id: number;
  numero: number;
  valorTotal: string;
  status:
    | "em_analise"
    | "preparando"
    | "feito"
    | "cancelado"
    | Record<string, unknown>;
  nomeCliente?: string;
  telefoneCliente?: string;
  formaPagamento?: string;
  mesa: Mesa;
  itens: PedidoItem[];
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatStatus(status: Pedido["status"]) {
  const value =
    typeof status === "string"
      ? status
      : typeof status === "object" && status && "value" in status
        ? String((status as { value?: unknown }).value)
        : "";
  if (value === "em_analise") return "Em analise";
  if (value === "preparando") return "Em preparo";
  if (value === "feito") return "Feito";
  if (value === "cancelado") return "Cancelado";
  return "Em analise";
}

function formatPaymentMethod(value?: string) {
  if (value === "pix") return "Pix";
  if (value === "dinheiro") return "Dinheiro";
  if (value === "credito") return "Credito";
  if (value === "debito") return "Debito";
  return "-";
}

export default async function PedidoDetalhePage({ params }: PageProps) {
  const { id } = await params;
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) redirect("/painel/login");

  let pedido: Pedido | null = null;
  try {
    const pedidos = await apiGet<Pedido[]>("/pedido", token);
    pedido = pedidos.find((item) => String(item.id) === String(id)) ?? null;
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 401) {
      redirect("/painel/login");
    }
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-[color:var(--brand-sand)]/88 px-6 py-10 text-[color:var(--color-gray-800)] lg:pl-[320px]">
        <div className="rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-bold">Pedido nao encontrado.</p>
          <Link
            href="/painel/pedido"
            className="mt-4 inline-flex rounded-full bg-[color:var(--color-blue-800)] px-4 py-2 text-xs font-bold text-white"
          >
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--brand-sand)]/88 px-6 py-10 text-[color:var(--color-gray-800)] lg:pl-[320px]">
      <div className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-gray-400)]">
              Pedido #{String(pedido.numero).padStart(5, "0")}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-[color:var(--color-gray-800)]">
              Mesa {pedido.mesa?.numero || "-"}
            </h1>
            <p className="mt-1 text-sm font-bold text-[color:var(--color-gray-500)]">
              Status: {formatStatus(pedido.status)}
            </p>
            <div className="mt-3 space-y-1 text-sm text-[color:var(--color-gray-500)]">
              <p>
                Cliente:{" "}
                <span className="font-bold text-[color:var(--color-gray-800)]">
                  {pedido.nomeCliente?.trim() || "-"}
                </span>
              </p>
              <p>
                Telefone:{" "}
                <span className="font-bold text-[color:var(--color-gray-800)]">
                  {pedido.telefoneCliente?.trim() || "-"}
                </span>
              </p>
              <p>
                Pagamento:{" "}
                <span className="font-bold text-[color:var(--color-gray-800)]">
                  {formatPaymentMethod(pedido.formaPagamento)}
                </span>
              </p>
            </div>
          </div>
          <Link
            href="/painel/pedido"
            className="rounded-full border border-[color:var(--color-blue-800)]/20 px-4 py-2 text-xs font-bold text-[color:var(--color-blue-800)]"
          >
            Voltar
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {pedido.itens?.map((item) => (
            <div
              key={item.id}
              className="rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] px-4 py-3 text-sm shadow-[var(--shadow-soft)]"
            >
              <p className="font-extrabold text-[color:var(--color-gray-800)]">
                {item.produto?.nome ?? `Item #${item.id}`}
              </p>
              <div className="mt-1 text-xs font-bold text-[color:var(--color-gray-500)]">
                <p>Quantidade: {item.qtSolicitada}</p>
                <p>Valor unitario: {item.valorUnit}</p>
                {item.additionals?.length ? (
                  <p>
                    Adicionais:{" "}
                    {item.additionals
                      .map((additional) => additional.nome ?? "Adicional")
                      .join(", ")}
                  </p>
                ) : null}
                {item.observacao ? <p>Obs: {item.observacao}</p> : null}
              </div>
            </div>
          ))}
          {pedido.itens?.length === 0 ? (
            <p className="text-sm font-bold text-[color:var(--color-gray-400)]">
              Sem itens.
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex justify-between text-sm font-extrabold text-[color:var(--color-gray-800)]">
          <span>Total</span>
          <span>{pedido.valorTotal}</span>
        </div>
      </div>
    </div>
  );
}
