import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "../../components/dashboard/Sidebar";
import { AUTH_TOKEN_COOKIE, ApiRequestError, apiGet } from "../../lib/api";
import { TableBase } from "../../smmanageapps/clientes/components/TableBase";

type Mesa = {
  numero?: number;
};

type Pedido = {
  id: number;
  numero: number;
  data?: string;
  valorTotal: string;
  status:
    | "em_analise"
    | "preparando"
    | "feito"
    | "cancelado"
    | { value?: string; label?: string };
  nomeCliente?: string;
  telefoneCliente?: string;
  formaPagamento?: string;
  mesa?: Mesa;
};

type PedidoStatusOption = {
  id: number;
  value: "em_analise" | "preparando" | "feito" | "cancelado";
  label: string;
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(
  value: string | string[] | undefined,
): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatStatus(value: Pedido["status"]) {
  const statusValue =
    typeof value === "string"
      ? value
      : value?.value ?? "";
  if (statusValue === "em_analise") return "Em analise";
  if (statusValue === "preparando") return "Em preparo";
  if (statusValue === "feito") return "Feito";
  if (statusValue === "cancelado") return "Cancelado";
  return "-";
}

function formatPaymentMethod(value?: string) {
  if (value === "pix") return "Pix";
  if (value === "dinheiro") return "Dinheiro";
  if (value === "credito") return "Credito";
  if (value === "debito") return "Debito";
  return "-";
}

function formatDate(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR");
}

async function loadPedidos(
  token: string,
  searchParams: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();
  const dateFrom = getSearchValue(searchParams.dateFrom);
  const dateTo = getSearchValue(searchParams.dateTo);
  const status = getSearchValue(searchParams.status);
  const valorMin = getSearchValue(searchParams.valorMin);
  const valorMax = getSearchValue(searchParams.valorMax);

  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (status) params.set("status", status);
  if (valorMin) params.set("valorMin", valorMin);
  if (valorMax) params.set("valorMax", valorMax);

  const path = params.toString() ? `/pedido?${params.toString()}` : "/pedido";
  const [pedidos, statuses] = await Promise.all([
    apiGet<Pedido[]>(path, token),
    apiGet<PedidoStatusOption[]>("/pedido-status", token),
  ]);

  return { pedidos, statuses, filters: { dateFrom, dateTo, status, valorMin, valorMax } };
}

export default async function PedidosTablePage({ searchParams }: PageProps) {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect("/painel/login");
  }

  const resolvedSearchParams = await searchParams;
  let pedidos: Pedido[] = [];
  let statuses: PedidoStatusOption[] = [];
  let error: string | null = null;

  try {
    const data = await loadPedidos(token, resolvedSearchParams);
    pedidos = data.pedidos;
    statuses = data.statuses;
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 401) {
      redirect("/painel/login");
    }
    error = err instanceof Error ? err.message : "Erro ao carregar pedidos.";
  }

  const dateFrom = getSearchValue(resolvedSearchParams.dateFrom);
  const dateTo = getSearchValue(resolvedSearchParams.dateTo);
  const status = getSearchValue(resolvedSearchParams.status);
  const valorMin = getSearchValue(resolvedSearchParams.valorMin);
  const valorMax = getSearchValue(resolvedSearchParams.valorMax);

  return (
    <div className="min-h-screen bg-[color:var(--brand-sand)]/88 text-[color:var(--color-gray-800)]">
      <Sidebar />

      <header className="flex items-center justify-between bg-[color:var(--panel-topbar-bg)] px-6 py-6 text-[color:var(--panel-topbar-fg)] shadow-[var(--shadow-soft-lg)] lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-green-500)]">
            <Image
              src="/brand/LogoSeuMenu.png"
              alt="Seu Menu"
              width={30}
              height={30}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-2xl px-6 pb-16 pt-6 lg:px-6 lg:pl-[320px] lg:pt-10">
        <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-gray-400)]">
                Operacao
              </p>
              <h1 className="mt-2 text-2xl font-extrabold text-[color:var(--color-gray-800)]">
                Todos os Pedidos
              </h1>
              <p className="mt-2 text-sm text-[color:var(--color-gray-500)]">
                Consulta completa de pedidos com filtros por periodo, status e valor.
              </p>
            </div>
            <Link
              href="/painel/pedido"
              className="inline-flex rounded-full border border-[color:var(--color-blue-800)]/20 px-4 py-2 text-xs font-bold text-[color:var(--color-blue-800)]"
            >
              Voltar ao kanban
            </Link>
          </div>

          <form className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-2 text-xs font-bold text-[color:var(--color-gray-500)]">
              Data inicial
              <input
                type="date"
                name="dateFrom"
                defaultValue={dateFrom}
                className="h-11 w-full rounded-[var(--radius-sm)] border border-[color:var(--color-gray-200)] bg-[color:var(--color-gray-50)] px-3 text-sm font-medium text-[color:var(--color-gray-800)] outline-none focus:ring-2 focus:ring-[color:var(--color-green-400)]"
              />
            </label>
            <label className="space-y-2 text-xs font-bold text-[color:var(--color-gray-500)]">
              Data final
              <input
                type="date"
                name="dateTo"
                defaultValue={dateTo}
                className="h-11 w-full rounded-[var(--radius-sm)] border border-[color:var(--color-gray-200)] bg-[color:var(--color-gray-50)] px-3 text-sm font-medium text-[color:var(--color-gray-800)] outline-none focus:ring-2 focus:ring-[color:var(--color-green-400)]"
              />
            </label>
            <label className="space-y-2 text-xs font-bold text-[color:var(--color-gray-500)]">
              Status
              <select
                name="status"
                defaultValue={status}
                className="h-11 w-full rounded-[var(--radius-sm)] border border-[color:var(--color-gray-200)] bg-[color:var(--color-gray-50)] px-3 text-sm font-medium text-[color:var(--color-gray-800)] outline-none focus:ring-2 focus:ring-[color:var(--color-green-400)]"
              >
                <option value="">Todos</option>
                {statuses.map((item) => (
                  <option key={item.id} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-xs font-bold text-[color:var(--color-gray-500)]">
              Valor minimo
              <input
                type="number"
                name="valorMin"
                min="0"
                step="0.01"
                defaultValue={valorMin}
                className="h-11 w-full rounded-[var(--radius-sm)] border border-[color:var(--color-gray-200)] bg-[color:var(--color-gray-50)] px-3 text-sm font-medium text-[color:var(--color-gray-800)] outline-none focus:ring-2 focus:ring-[color:var(--color-green-400)]"
              />
            </label>
            <label className="space-y-2 text-xs font-bold text-[color:var(--color-gray-500)]">
              Valor maximo
              <input
                type="number"
                name="valorMax"
                min="0"
                step="0.01"
                defaultValue={valorMax}
                className="h-11 w-full rounded-[var(--radius-sm)] border border-[color:var(--color-gray-200)] bg-[color:var(--color-gray-50)] px-3 text-sm font-medium text-[color:var(--color-gray-800)] outline-none focus:ring-2 focus:ring-[color:var(--color-green-400)]"
              />
            </label>
            <div className="flex gap-3 md:col-span-2 xl:col-span-5">
              <button
                type="submit"
                className="rounded-full bg-[color:var(--color-blue-800)] px-5 py-2 text-xs font-bold text-white"
              >
                Filtrar
              </button>
              <Link
                href="/painel/pedidosTable"
                className="rounded-full border border-[color:var(--color-gray-300)] px-5 py-2 text-xs font-bold text-[color:var(--color-gray-600)]"
              >
                Limpar
              </Link>
            </div>
          </form>

          {error ? (
            <div className="mt-6 rounded-[var(--radius-md)] border border-[color:var(--color-status-danger)]/30 bg-[color:var(--color-status-danger)]/10 p-4 text-sm font-bold text-[color:var(--color-gray-800)]">
              {error}
            </div>
          ) : null}

          <div className="mt-6">
            <TableBase
              headers={[
                "Numero",
                "Data/Hora",
                "Cliente",
                "Telefone",
                "Mesa",
                "Status",
                "Pagamento",
                "Valor total",
              ]}
            >
              {pedidos.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-4 text-sm font-medium text-[color:var(--color-gray-500)]"
                  >
                    Nenhum pedido encontrado para os filtros informados.
                  </td>
                </tr>
              ) : (
                pedidos.map((pedido) => (
                  <tr key={pedido.id} className="bg-white">
                    <td className="px-3 py-3 font-semibold text-[color:var(--color-gray-800)]">
                      <Link href={`/painel/pedido/${pedido.id}`}>
                        #{String(pedido.numero).padStart(5, "0")}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-[color:var(--color-gray-600)]">
                      {formatDate(pedido.data)}
                    </td>
                    <td className="px-3 py-3 text-[color:var(--color-gray-600)]">
                      {pedido.nomeCliente?.trim() || "-"}
                    </td>
                    <td className="px-3 py-3 text-[color:var(--color-gray-600)]">
                      {pedido.telefoneCliente?.trim() || "-"}
                    </td>
                    <td className="px-3 py-3 text-[color:var(--color-gray-600)]">
                      {pedido.mesa?.numero || "-"}
                    </td>
                    <td className="px-3 py-3 text-[color:var(--color-gray-600)]">
                      {formatStatus(pedido.status)}
                    </td>
                    <td className="px-3 py-3 text-[color:var(--color-gray-600)]">
                      {formatPaymentMethod(pedido.formaPagamento)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-[color:var(--color-gray-800)]">
                      {pedido.valorTotal}
                    </td>
                  </tr>
                ))
              )}
            </TableBase>
          </div>
        </section>
      </main>
    </div>
  );
}
