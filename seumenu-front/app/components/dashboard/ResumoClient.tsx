"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiRequest } from "../../lib/api";
import { BrandLoading } from "../shared/BrandLoading";
import { AlertsPanel } from "./AlertsPanel";
import { HeroSection } from "./HeroSection";
import { KanbanSection } from "./KanbanSection";
import { MenuSection } from "./MenuSection";
import { OrdersSection, type PedidoDisplay } from "./OrdersSection";
import { TablesSection } from "./TablesSection";

type MesaResumo = {
  id: number;
  numero: number;
  descricao?: string;
  setor?: string;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
};

type DashboardResumo = {
  pedidosEmAndamentoHoje: number;
  totalProdutos: number;
  totalAdicionais: number;
  totalGruposProdutos: number;
  mesas: MesaResumo[];
  pedidosHoje: unknown[];
};

type KanbanColumn = {
  status: string;
  cards: {
    id: string;
    mesa: string;
    itens: string;
    total: string;
    rawId?: string | number;
    statusValue?: string;
  }[];
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizePedidos(pedidos: unknown[]): PedidoDisplay[] {
  return pedidos.map((pedido, index) => {
    const data = pedido as Record<string, unknown>;
    const rawId =
      (data.numero as string | number | undefined) ??
      (data.codigo as string | number | undefined) ??
      (data.id as string | number | undefined) ??
      index + 1;
    const id = rawId.toString().startsWith("#") ? rawId.toString() : `#${rawId}`;
    const mesaFromObject =
      typeof data.mesa === "object" && data.mesa !== null
        ? (data.mesa as { numero?: number | string }).numero
        : undefined;
    const mesaNumero =
      (data.mesaNumero as string | number | undefined) ??
      mesaFromObject ??
      (data.mesa as string | number | undefined) ??
      (data.table as { numero?: number | string } | undefined)?.numero;
    const mesa =
      mesaNumero && typeof mesaNumero === "string"
        ? mesaNumero.toLowerCase().includes("mesa")
          ? mesaNumero
          : `Mesa ${mesaNumero}`
        : mesaNumero
          ? `Mesa ${mesaNumero}`
          : "Mesa";
    const valorRaw =
      (data.valor as number | string | undefined) ??
      (data.total as number | string | undefined) ??
      (data.totalPedido as number | string | undefined) ??
      (data.valorTotal as number | string | undefined);
    const valor =
      typeof valorRaw === "number"
        ? formatCurrency(valorRaw)
        : typeof valorRaw === "string"
          ? valorRaw
          : "—";
    const statusCandidate =
      (data.status as unknown) ??
      (data.statusNome as unknown) ??
      (data.situacao as unknown) ??
      "—";
    const status =
      typeof statusCandidate === "string"
        ? statusCandidate
        : statusCandidate &&
            typeof statusCandidate === "object" &&
            ("label" in statusCandidate || "value" in statusCandidate)
          ? String(
              (statusCandidate as { label?: unknown; value?: unknown }).label ??
                (statusCandidate as { value?: unknown }).value ??
                "—",
            )
          : String(statusCandidate ?? "—");
    const horaRaw =
      (data.hora as string | undefined) ??
      (data.criadoEm as string | undefined) ??
      (data.createdAt as string | undefined);
    const hora = horaRaw ? formatTime(horaRaw) : "—";

    return { id, mesa, valor, status, hora };
  });
}

function normalizeStatus(
  value: unknown,
): "em_analise" | "preparando" | "feito" | "cancelado" {
  const raw =
    typeof value === "string"
      ? value.toLowerCase()
      : value && typeof value === "object" && "value" in value
        ? String((value as { value?: unknown }).value ?? "").toLowerCase()
        : value != null
          ? String(value).toLowerCase()
          : "";
  if (raw.includes("prep")) return "preparando";
  if (raw.includes("feito") || raw.includes("final")) return "feito";
  if (raw.includes("cancel")) return "cancelado";
  return "em_analise";
}

function formatItemCount(value: unknown): string {
  if (Array.isArray(value)) {
    return `${value.length} item(ns)`;
  }
  if (typeof value === "number") {
    return `${value} item(ns)`;
  }
  return "Sem itens";
}

function normalizeKanban(pedidos: unknown[]): KanbanColumn[] {
  const grouped: Record<"em_analise" | "preparando" | "feito", KanbanColumn["cards"]> = {
    em_analise: [],
    preparando: [],
    feito: [],
  };

  pedidos.forEach((pedido, index) => {
    const data = pedido as Record<string, unknown>;
    const status = normalizeStatus(
      data.status ?? data.statusNome ?? data.situacao ?? data.statusPedido,
    );
    if (status === "cancelado") {
      return;
    }
    const rawId =
      (data.id as string | number | undefined) ??
      (data.codigo as string | number | undefined) ??
      (data.numero as string | number | undefined) ??
      index + 1;
    const id = rawId.toString().startsWith("#") ? rawId.toString() : `#${rawId}`;
    const mesaFromObject =
      typeof data.mesa === "object" && data.mesa !== null
        ? (data.mesa as { numero?: number | string }).numero
        : undefined;
    const mesaNumero =
      (data.mesaNumero as string | number | undefined) ??
      mesaFromObject ??
      (data.mesa as string | number | undefined);
    const mesa = mesaNumero ? `Mesa ${mesaNumero}` : "Mesa";
    const itens = formatItemCount(data.itens ?? data.items ?? data.qtItens);
    const valorRaw =
      (data.valorTotal as number | string | undefined) ??
      (data.total as number | string | undefined) ??
      (data.valor as number | string | undefined);
    const total =
      typeof valorRaw === "number"
        ? formatCurrency(valorRaw)
        : typeof valorRaw === "string"
          ? valorRaw
          : "—";

    grouped[status].push({
      id,
      mesa,
      itens,
      total,
      rawId: data.id as string | number | undefined,
      statusValue: status,
    });
  });

  return [
    { status: "em_analise", cards: grouped.em_analise },
    { status: "preparando", cards: grouped.preparando },
    { status: "feito", cards: grouped.feito },
  ];
}

export function ResumoClient() {
  const [summary, setSummary] = useState<DashboardResumo | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiGet<DashboardResumo>("/dashboard/resumo")
      .then((response) => {
        if (!active) return;
        setSummary(response);
      })
      .catch((err) => {
        if (!active) return;
        const message =
          err instanceof Error
            ? err.message
            : "Nao foi possivel carregar o resumo.";
        setError(message);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const pedidosHoje = useMemo(
    () => (summary ? normalizePedidos(summary.pedidosHoje) : []),
    [summary],
  );
  const kanbanHoje = useMemo(
    () => (summary ? normalizeKanban(summary.pedidosHoje) : []),
    [summary],
  );
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(
    kanbanHoje,
  );

  const displayedKanban = useMemo(() => {
    return kanbanColumns.length ? kanbanColumns : kanbanHoje;
  }, [kanbanColumns, kanbanHoje]);

  useEffect(() => {
    let active = true;
    apiRequest<{ id: number; value: string }[]>("/pedido-status", {
      method: "GET",
    })
      .then((data) => {
        if (!active) return;
        const map: Record<string, number> = {};
        data.forEach((item) => {
          map[item.value] = item.id;
        });
        setStatusMap(map);
      })
      .catch(() => {
        if (!active) return;
        setStatusMap({});
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {loading ? (
        <div className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
          <BrandLoading />
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[var(--radius-md)] border border-[color:var(--color-status-danger)]/40 bg-[color:var(--color-status-danger)]/10 p-4 text-sm font-semibold text-[color:var(--color-status-danger)] shadow-[var(--shadow-soft)]">
          {error}
        </div>
      ) : null}

      <KanbanSection
        columns={displayedKanban}
        onMove={async (card, fromStatus, toStatus) => {
          if (fromStatus === toStatus) return;
          const statusId = statusMap[toStatus];
          if (!statusId) return;
          const previous = kanbanColumns;
          setKanbanColumns((prev) =>
            prev.map((col) => {
              if (col.status === fromStatus) {
                return {
                  ...col,
                  cards: col.cards.filter((item) => item.id !== card.id),
                };
              }
              if (col.status === toStatus) {
                return {
                  ...col,
                  cards: [card, ...col.cards],
                };
              }
              return col;
            }),
          );
          try {
            if (!card.rawId) return;
            await apiRequest(`/pedido/status/${card.rawId}`, {
              method: "PATCH",
              body: JSON.stringify({ statusId }),
            });
          } catch {
            setKanbanColumns(previous);
          }
        }}
      />
      <HeroSection stats={summary ?? undefined} />

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <TablesSection mesas={summary?.mesas} />
        <OrdersSection pedidos={pedidosHoje} />
      </section>

      <AlertsPanel />
      <MenuSection stats={summary ?? undefined} />
    </>
  );
}
