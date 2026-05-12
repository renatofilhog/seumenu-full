"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../../lib/api";
import { PedidoEventPayload, usePedidoEvents } from "./usePedidoEvents";

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

type PedidoStatusValue = "em_analise" | "preparando" | "feito" | "cancelado";
type OperationalStatus = Exclude<PedidoStatusValue, "cancelado">;

type Pedido = {
  id: number;
  numero: number;
  data?: string;
  valorTotal: string;
  status: PedidoStatusValue;
  nomeCliente?: string;
  telefoneCliente?: string;
  formaPagamento?: string;
  mesa: Mesa;
  itens: PedidoItem[];
};

type TenantContext = {
  nome?: string;
};

type KanbanColumn = {
  status: OperationalStatus;
  pedidos: Pedido[];
};

type PedidoClientProps = {
  kanban: KanbanColumn[];
  error: string | null;
};

const operationalStatuses: OperationalStatus[] = [
  "em_analise",
  "preparando",
  "feito",
];

const statusLabelMap: Record<PedidoStatusValue, string> = {
  em_analise: "Solicitado",
  preparando: "Em preparo",
  feito: "Finalizado",
  cancelado: "Cancelado",
};

const statusColorMap: Record<PedidoStatusValue, string> = {
  em_analise: "var(--color-status-info)",
  preparando: "var(--color-status-warning)",
  feito: "var(--color-gray-300)",
  cancelado: "var(--color-status-danger)",
};

function formatStatus(status: PedidoStatusValue) {
  if (status === "em_analise") return "Em analise";
  if (status === "preparando") return "Em preparo";
  if (status === "feito") return "Feito";
  return "Cancelado";
}

function formatPaymentMethod(value?: string) {
  if (value === "pix") return "Pix";
  if (value === "dinheiro") return "Dinheiro";
  if (value === "credito") return "Credito";
  if (value === "debito") return "Debito";
  return "-";
}

function formatCurrency(value: string) {
  const parsed = Number(String(value).replace(",", "."));
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(parsed);
}

function formatOrderDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function normalizeStatusValue(value: unknown): PedidoStatusValue {
  if (typeof value === "string") {
    if (
      value === "em_analise" ||
      value === "preparando" ||
      value === "feito" ||
      value === "cancelado"
    ) {
      return value;
    }
  }
  if (value && typeof value === "object") {
    const candidate = (value as { value?: unknown }).value;
    if (
      typeof candidate === "string" &&
      (candidate === "em_analise" ||
        candidate === "preparando" ||
        candidate === "feito" ||
        candidate === "cancelado")
    ) {
      return candidate;
    }
  }
  return "em_analise";
}

function normalizePedidos(pedidos: Pedido[]): Pedido[] {
  return pedidos.map((pedido) => ({
    ...pedido,
    status: normalizeStatusValue((pedido as { status?: unknown }).status),
  }));
}

function isWithinOperationalWindow(pedido: Pedido) {
  if (!pedido.data) {
    return true;
  }

  const parsed = new Date(pedido.data);
  if (Number.isNaN(parsed.getTime())) {
    return true;
  }

  return parsed.getTime() >= Date.now() - 24 * 60 * 60 * 1000;
}

function normalizeKanban(kanban: KanbanColumn[]): KanbanColumn[] {
  return kanban.map((column) => ({
    ...column,
    status: normalizeStatusValue((column as { status?: unknown }).status) as OperationalStatus,
    pedidos: normalizePedidos(column.pedidos).filter(
      (pedido) => pedido.status !== "cancelado",
    ),
  }));
}

function buildKanban(pedidos: Pedido[]): KanbanColumn[] {
  const columns: KanbanColumn[] = operationalStatuses.map((status) => ({
    status,
    pedidos: [],
  }));

  pedidos
    .filter((pedido) => pedido.status !== "cancelado")
    .forEach((pedido) => {
      const column = columns.find((col) => col.status === pedido.status);
      if (column) {
        column.pedidos.push(pedido);
      }
    });

  return columns;
}

function isOperationalStatus(status: PedidoStatusValue): status is OperationalStatus {
  return operationalStatuses.includes(status as OperationalStatus);
}

export function PedidoClient({ kanban, error }: PedidoClientProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [pedidoError, setPedidoError] = useState<string | null>(null);
  const [pedidoSuccess, setPedidoSuccess] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>("Seu Menu");
  const [dragging, setDragging] = useState<{
    pedidoId: number;
    fromStatus: OperationalStatus;
  } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Pedido | null>(null);
  const [printTarget, setPrintTarget] = useState<Pedido | null>(null);

  const normalizedKanban = useMemo(() => normalizeKanban(kanban), [kanban]);
  const [kanbanState, setKanbanState] = useState<KanbanColumn[]>(
    normalizedKanban.length ? normalizedKanban : buildKanban([]),
  );
  const [statusMap, setStatusMap] = useState<Record<string, number>>({});

  useEffect(() => {
    setKanbanState(
      normalizedKanban.length ? normalizedKanban : buildKanban([]),
    );
  }, [normalizedKanban]);

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

  useEffect(() => {
    let active = true;

    apiRequest<TenantContext>("/tenant/resolve", {
      method: "GET",
    })
      .then((data) => {
        if (!active) return;
        setTenantName(data?.nome?.trim() || "Seu Menu");
      })
      .catch(() => {
        if (!active) return;
        setTenantName("Seu Menu");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, []);

  const playNewOrderBell = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      return;
    }

    const context = audioContextRef.current ?? new AudioContextCtor();
    audioContextRef.current = context;

    const startBell = () => {
      const now = context.currentTime;
      const masterGain = context.createGain();
      masterGain.connect(context.destination);
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      const baseOscillator = context.createOscillator();
      baseOscillator.type = "sine";
      baseOscillator.frequency.setValueAtTime(1046, now);
      baseOscillator.frequency.exponentialRampToValueAtTime(1318, now + 0.16);
      baseOscillator.connect(masterGain);

      const accentOscillator = context.createOscillator();
      accentOscillator.type = "triangle";
      accentOscillator.frequency.setValueAtTime(1568, now);
      accentOscillator.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
      accentOscillator.connect(masterGain);

      baseOscillator.start(now);
      accentOscillator.start(now);
      baseOscillator.stop(now + 0.36);
      accentOscillator.stop(now + 0.24);
    };

    if (context.state === "suspended") {
      void context.resume().then(startBell).catch(() => undefined);
      return;
    }

    startBell();
  }, []);

  const syncPedidoFromEvent = useCallback((incomingPedido: Pedido) => {
    if (!isWithinOperationalWindow(incomingPedido)) {
      return;
    }

    setKanbanState((prev) => {
      const next = prev.map((column) => ({
        ...column,
        pedidos: column.pedidos.filter((pedido) => pedido.id !== incomingPedido.id),
      }));

      if (incomingPedido.status === "cancelado") {
        return next;
      }

      const targetColumn = next.find((column) => column.status === incomingPedido.status);
      if (targetColumn) {
        targetColumn.pedidos.unshift(incomingPedido);
      }

      return next;
    });
  }, []);

  const handlePedidoEvent = useCallback((event: PedidoEventPayload) => {
    const normalizedPedido = normalizePedidos([event.pedido as Pedido])[0];
    if (!normalizedPedido) {
      return;
    }
    if (event.type === "created") {
      playNewOrderBell();
    }
    syncPedidoFromEvent(normalizedPedido);
  }, [playNewOrderBell, syncPedidoFromEvent]);

  const refetchKanban = useCallback(async () => {
    try {
      const data = await apiRequest<KanbanColumn[]>("/pedido-status/kanban", {
        method: "GET",
      });
      const normalized = normalizeKanban(data);
      setKanbanState(normalized.length ? normalized : buildKanban([]));
    } catch {
      // ignore
    }
  }, []);

  const { connected: sseConnected } = usePedidoEvents({
    enabled: !error,
    onPedidoEvent: handlePedidoEvent,
    onReconnected: refetchKanban,
  });

  async function applyStatusChange(
    pedidoId: number,
    fromStatus: PedidoStatusValue,
    toStatus: PedidoStatusValue,
  ) {
    if (fromStatus === toStatus) return;

    setPedidoError(null);
    setPedidoSuccess(null);

    const previousKanban = kanbanState;

    setKanbanState((prev) => {
      const next = prev.map((column) => ({
        ...column,
        pedidos: [...column.pedidos],
      }));
      const fromColumn = isOperationalStatus(fromStatus)
        ? next.find((column) => column.status === fromStatus)
        : null;
      const toColumn = isOperationalStatus(toStatus)
        ? next.find((column) => column.status === toStatus)
        : null;

      if (fromColumn) {
        const index = fromColumn.pedidos.findIndex((pedido) => pedido.id === pedidoId);
        if (index >= 0) {
          const [pedido] = fromColumn.pedidos.splice(index, 1);
          pedido.status = toStatus;
          if (toColumn) {
            toColumn.pedidos.unshift(pedido);
          }
        }
      }

      return next;
    });

    const statusId = statusMap[toStatus];
    if (!statusId) {
      setPedidoError("Nao foi possivel atualizar o status.");
      setKanbanState(previousKanban);
      return;
    }

    try {
      await apiRequest(`/pedido/status/${pedidoId}`, {
        method: "PATCH",
        body: JSON.stringify({ statusId }),
      });
      setPedidoSuccess(
        toStatus === "cancelado"
          ? "Pedido cancelado com sucesso."
          : "Status atualizado com sucesso.",
      );
      window.setTimeout(() => {
        setPedidoSuccess(null);
      }, 2500);
    } catch (err) {
      setPedidoError(
        err instanceof Error ? err.message : "Erro ao atualizar status.",
      );
      setKanbanState(previousKanban);
    }
  }

  async function movePedido(
    pedidoId: number,
    fromStatus: OperationalStatus,
    toStatus: OperationalStatus,
  ) {
    await applyStatusChange(pedidoId, fromStatus, toStatus);
  }

  async function confirmCancelPedido() {
    if (!cancelTarget) return;
    await applyStatusChange(cancelTarget.id, cancelTarget.status, "cancelado");
    setCancelTarget(null);
  }

  function handlePrintPedido(pedido: Pedido) {
    setPrintTarget(pedido);

    window.setTimeout(() => {
      window.print();
    }, 0);
  }

  return (
    <main className="mx-auto w-full max-w-screen-2xl px-6 pb-28 pt-6 lg:px-6 lg:pb-10 lg:pl-[320px] lg:pt-10">
      <section className="space-y-6 lg:space-y-8">
        {error ? (
          <div className="rounded-[var(--radius-md)] border border-[color:var(--color-status-danger)]/30 bg-[color:var(--color-status-danger)]/10 p-4 text-sm font-bold text-[color:var(--color-gray-800)]">
            {error}
          </div>
        ) : null}
        {pedidoError ? (
          <div className="rounded-[var(--radius-md)] border border-[color:var(--color-status-danger)]/30 bg-[color:var(--color-status-danger)]/10 p-4 text-sm font-bold text-[color:var(--color-gray-800)]">
            {pedidoError}
          </div>
        ) : null}
        {pedidoSuccess ? (
          <div className="rounded-[var(--radius-md)] border border-[color:var(--color-status-success)]/30 bg-[color:var(--color-status-success)]/10 p-4 text-sm font-bold text-[color:var(--color-status-success)]">
            {pedidoSuccess}
          </div>
        ) : null}

      </section>

      <section className="mt-10 rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-[color:var(--color-gray-800)]">
              Kanban de status
            </h3>
            <p className="text-xs font-bold text-[color:var(--color-gray-500)]">
              Somente pedidos das ultimas 24 horas. Pedidos cancelados saem desta visao.
            </p>
          </div>
          {!error && (
            <span
              className={`rounded-full px-4 py-1 text-xs font-bold ${
                sseConnected
                  ? "bg-[color:var(--color-green-100)] text-[color:var(--color-green-700)]"
                  : "bg-[color:var(--color-status-warning)]/10 text-[color:var(--color-status-warning)]"
              }`}
            >
              {sseConnected ? "Atualizacao em tempo real" : "Reconectando..."}
            </span>
          )}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {kanbanState.map((column) => (
            <div
              key={column.status}
              className="rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] p-4"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const payload = event.dataTransfer.getData("text/plain");
                if (!payload) return;
                const [pedidoIdRaw, fromStatusRaw] = payload.split(":");
                if (!pedidoIdRaw || !fromStatusRaw) return;
                void movePedido(
                  Number(pedidoIdRaw),
                  fromStatusRaw as OperationalStatus,
                  column.status,
                );
                setDragging(null);
              }}
              onPointerUp={() => {
                if (!dragging) return;
                void movePedido(
                  dragging.pedidoId,
                  dragging.fromStatus,
                  column.status,
                );
                setDragging(null);
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-gray-400)]">
                  {formatStatus(column.status)}
                </p>
                <span className="rounded-full bg-[color:var(--color-white)] px-3 py-1 text-xs font-bold text-[color:var(--color-gray-500)] shadow-[var(--shadow-soft)]">
                  {column.pedidos.length}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {column.pedidos.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-4 shadow-[var(--shadow-soft)]"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        "text/plain",
                        `${pedido.id}:${column.status}`,
                      );
                    }}
                    onPointerDown={() =>
                      setDragging({ pedidoId: pedido.id, fromStatus: column.status })
                    }
                  >
                    <Link href={`/painel/pedido/${pedido.id}`} className="block">
                      <div className="flex items-center justify-between text-sm">
                        <p className="font-extrabold text-[color:var(--color-gray-800)]">
                          #{String(pedido.numero).padStart(5, "0")}
                        </p>
                        <span className="text-xs font-bold text-[color:var(--color-gray-400)]">
                          Mesa {pedido.mesa?.numero || "-"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-bold text-[color:var(--color-gray-500)]">
                        {pedido.nomeCliente?.trim() || "Cliente nao informado"}
                      </p>
                      <p className="mt-1 text-[11px] text-[color:var(--color-gray-400)]">
                        {pedido.telefoneCliente?.trim() || "-"} ·{" "}
                        {formatPaymentMethod(pedido.formaPagamento)}
                      </p>
                      <p className="mt-2 text-xs font-bold text-[color:var(--color-gray-500)]">
                        {pedido.itens?.length || 0} itens
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {pedido.itens?.slice(0, 2).map((item) => (
                          <span
                            key={item.id}
                            className="rounded-full bg-[color:var(--color-gray-50)] px-2 py-1 text-[10px] font-bold text-[color:var(--color-gray-500)]"
                          >
                            Item #{item.id}
                          </span>
                        ))}
                      </div>
                    </Link>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                      <span className="font-extrabold text-[color:var(--color-gray-800)]">
                        {formatCurrency(pedido.valorTotal)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[color:var(--color-green-100)] px-3 py-1 text-[color:var(--color-green-700)]">
                          {formatStatus(pedido.status)}
                        </span>
                        <button
                          type="button"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handlePrintPedido(pedido);
                          }}
                          aria-label={`Imprimir pedido ${pedido.numero}`}
                          title="Imprimir comanda"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-status-success)]/25 text-[color:var(--color-status-success)] transition hover:bg-[color:var(--color-status-success)]/8"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M7 8V4h10v4"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M7 14h10v6H7z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M17 11h.01"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                        {pedido.status !== "feito" ? (
                        <button
                          type="button"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setCancelTarget(pedido);
                          }}
                          aria-label={`Cancelar pedido ${pedido.numero}`}
                          title="Cancelar pedido"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-status-danger)]/25 text-[color:var(--color-status-danger)] transition hover:bg-[color:var(--color-status-danger)]/8"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 7h16"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M7 7l1 12a1 1 0 0 0 1 .92h6a1 1 0 0 0 1-.92L17 7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M10 11v5M14 11v5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
                {column.pedidos.length === 0 ? (
                  <p className="text-xs font-bold text-[color:var(--color-gray-400)]">
                    Sem pedidos.
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {cancelTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft-lg)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-gray-400)]">
              Confirmacao
            </p>
            <h4 className="mt-2 text-lg font-extrabold text-[color:var(--color-gray-800)]">
              Recusar pedido #{String(cancelTarget.numero).padStart(5, "0")}?
            </h4>
            <p className="mt-2 text-sm text-[color:var(--color-gray-500)]">
              O pedido sera marcado como cancelado e deixara de aparecer no kanban operacional.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="rounded-full border border-[color:var(--color-gray-300)] px-4 py-2 text-xs font-bold text-[color:var(--color-gray-600)]"
              >
                Nao
              </button>
              <button
                type="button"
                onClick={() => void confirmCancelPedido()}
                className="rounded-full bg-[color:var(--color-status-danger)] px-4 py-2 text-xs font-bold text-white"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-[200vw] top-0 hidden print:block"
      >
        {printTarget ? (
          <section className="print-order-ticket text-black">
            <header className="border-b border-dashed border-black pb-4 text-center">
              <p className="text-[22px] font-bold">{tenantName}</p>
              <p className="mt-2 text-[26px] font-extrabold">
                Comanda #{String(printTarget.numero).padStart(5, "0")}
              </p>
            </header>

            <div className="mt-4 border-y border-dashed border-black py-3 text-center text-[28px] font-extrabold">
              MESA {printTarget.mesa?.numero || "-"}
            </div>

            <div className="mt-4 space-y-2 text-[18px]">
              <p>
                <span className="font-bold">Cliente:</span>{" "}
                {printTarget.nomeCliente?.trim() || "-"}
              </p>
              <p>
                <span className="font-bold">Telefone:</span>{" "}
                {printTarget.telefoneCliente?.trim() || "-"}
              </p>
              <p>
                <span className="font-bold">Data:</span>{" "}
                {formatOrderDate(printTarget.data)}
              </p>
            </div>

            <div className="mt-4 border-t border-dashed border-black pt-4">
              {printTarget.itens?.map((item) => (
                <article key={item.id} className="mb-4 break-inside-avoid text-[18px]">
                  <p className="text-[20px] font-extrabold leading-tight">
                    {item.qtSolicitada}x {item.produto?.nome ?? `Item #${item.id}`}
                  </p>
                  {item.additionals?.length ? (
                    <p className="mt-2 pl-3 text-[16px]">
                      +{" "}
                      {item.additionals
                        .map((additional) => additional.nome?.trim() || "Adicional")
                        .join(", ")}
                    </p>
                  ) : null}
                  {item.observacao?.trim() ? (
                    <p className="mt-2 pl-3 text-[16px]">Obs: {item.observacao.trim()}</p>
                  ) : null}
                </article>
              ))}
            </div>

            <footer className="border-t border-dashed border-black pt-4 text-[22px]">
              <p className="flex items-center justify-between text-[24px] font-extrabold">
                <span>Total</span>
                <span>{formatCurrency(printTarget.valorTotal)}</span>
              </p>
            </footer>
          </section>
        ) : null}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 4mm;
          }

          body * {
            visibility: hidden !important;
          }

          .print-order-ticket,
          .print-order-ticket * {
            visibility: visible !important;
          }

          .print-order-ticket {
            position: fixed;
            left: 0;
            top: 0;
            display: block !important;
            width: 72mm;
            padding: 0;
            font-family: Arial, sans-serif;
            line-height: 1.35;
            color: #000;
            background: transparent;
          }
        }
      `}</style>
    </main>
  );
}
