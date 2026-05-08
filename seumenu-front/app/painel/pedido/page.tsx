import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "../../components/dashboard/Sidebar";
import { AUTH_TOKEN_COOKIE, ApiRequestError, apiGet } from "../../lib/api";
import { PedidoClient } from "./PedidoClient";

type Mesa = {
  numero: number;
  setor: string;
};

type PedidoItem = {
  id: number;
  qtSolicitada: number;
  valorUnit: string;
};

type Pedido = {
  id: number;
  numero: number;
  data?: string;
  valorTotal: string;
  status: "em_analise" | "preparando" | "feito" | "cancelado";
  nomeCliente?: string;
  telefoneCliente?: string;
  formaPagamento?: string;
  mesa: Mesa;
  itens: PedidoItem[];
};

type KanbanColumn = {
  status: "em_analise" | "preparando" | "feito";
  pedidos: Pedido[];
};

type PedidoData = {
  kanban: KanbanColumn[];
  error: string | null;
};

async function loadPedidos(token: string): Promise<PedidoData> {
  try {
    const kanban = await apiGet<KanbanColumn[]>("/pedido-status/kanban", token);

    return { kanban, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar";
    return { kanban: [], error: message };
  }
}

export default async function PedidoPage() {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect("/painel/login");
  }

  let kanban: KanbanColumn[] = [];
  let error: string | null = null;

  try {
    const data = await loadPedidos(token);
    kanban = data.kanban;
    error = data.error;
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 401) {
      redirect("/painel/login");
    }
    error = err instanceof Error ? err.message : "Erro ao carregar";
  }
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
        <button
          type="button"
          aria-label="Notificacoes"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--panel-topbar-fg)]/20"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 4C9.24 4 7 6.24 7 9v3.25c0 .64-.26 1.25-.7 1.7L5 15.25h14l-1.3-1.3c-.45-.45-.7-1.06-.7-1.7V9c0-2.76-2.24-5-5-5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 18a2.5 2.5 0 0 0 5 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      <PedidoClient kanban={kanban} error={error} />

      <nav className="fixed bottom-6 left-1/2 z-20 w-[88%] -translate-x-1/2 rounded-[var(--radius-pill)] bg-[color:var(--color-white)] px-8 py-3 shadow-[var(--shadow-soft-lg)] lg:hidden">
        <div className="flex items-center justify-between text-[10px] font-bold text-[color:var(--color-blue-800)]">
          <Link
            href="/painel"
            className="flex flex-col items-center gap-1"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 11l8-7 8 7v7a2 2 0 0 1-2 2h-4v-6H10v6H6a2 2 0 0 1-2-2v-7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            Inicio
          </Link>
          <Link
            href="/painel/pedido"
            className="flex flex-col items-center gap-1 text-[color:var(--color-status-success)]"
            aria-current="page"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(47,213,115,0.15)]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M7 7h10M7 12h10M7 17h6"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <rect
                  x="4.5"
                  y="4.5"
                  width="15"
                  height="15"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="2.4"
                />
              </svg>
            </div>
            Kanban
          </Link>
          <Link
            href="/painel/cardapio/produtos"
            className="flex flex-col items-center gap-1"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 7a3 3 0 0 1 6 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            Loja
          </Link>
        </div>
      </nav>
    </div>
  );
}
