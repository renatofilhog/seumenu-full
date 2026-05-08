"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../../lib/api";
import { loadOrder, saveOrder, type OrderState } from "./orderStorage";
import { useOrderStatusEvents } from "./useOrderStatusEvents";

type PedidoStatus = {
  id: number;
  value: string;
  label: string;
};

type PedidoStatusResponse = {
  statusId: number;
};

type StoreInfo = {
  tempoMedioPreparo?: number;
};

export function OrderTrackingClient() {
  const [order, setOrder] = useState<OrderState | null>(() => loadOrder());
  const orderIdentifier = order?.pedidoNumero ?? order?.pedidoId ?? null;
  const [statusList, setStatusList] = useState<PedidoStatus[]>([]);
  const [currentStatusId, setCurrentStatusId] = useState<number | null>(
    order?.statusId ?? null,
  );
  const [usePollingFallback, setUsePollingFallback] = useState(false);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(
    order?.acceptedAt ?? null,
  );
  const prevStatusIdRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<PedidoStatus[]>("/pedido-status", { method: "GET", authScope: "public" })
      .then((data) => {
        if (!active) return;
        setStatusList(data);
      })
      .catch(() => {
        if (!active) return;
        setStatusList([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest<StoreInfo[]>("/store", { method: "GET", authScope: "public" })
      .then((data) => {
        if (!active) return;
        setStoreInfo(data?.[0] ?? null);
      })
      .catch(() => {
        if (!active) return;
      });
    return () => {
      active = false;
    };
  }, []);

  const preparandoStatusId = useMemo(
    () => statusList.find((s) => s.value === "preparando")?.id ?? null,
    [statusList],
  );

  // Detect the transition into "preparando" to record the acceptance timestamp.
  useEffect(() => {
    const prev = prevStatusIdRef.current;
    prevStatusIdRef.current = currentStatusId;

    if (!currentStatusId || !preparandoStatusId || acceptedAt) return;
    // Only record when transitioning FROM another status (not on initial page load).
    if (currentStatusId === preparandoStatusId && prev !== null && prev !== preparandoStatusId) {
      const now = new Date().toISOString();
      setAcceptedAt(now);
      setOrder((prevOrder) => {
        if (!prevOrder) return prevOrder;
        const updated = { ...prevOrder, acceptedAt: now };
        saveOrder(updated);
        return updated;
      });
    }
  }, [currentStatusId, preparandoStatusId, acceptedAt]);

  const applyStatusUpdate = useCallback((statusId: number | null) => {
    setCurrentStatusId(statusId);
    setOrder((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, statusId: statusId ?? undefined };
      saveOrder(updated);
      return updated;
    });
  }, []);

  useEffect(() => {
    if (!orderIdentifier) return;

    let active = true;
    const fetchStatus = async () => {
      try {
        const data = await apiRequest<PedidoStatusResponse>(
          `/pedido/status/${orderIdentifier}`,
          { method: "GET", authScope: "public" },
        );
        if (!active) return;
        applyStatusUpdate(data.statusId);
      } catch {
        if (!active) return;
      }
    };

    void fetchStatus();

    return () => {
      active = false;
    };
  }, [applyStatusUpdate, orderIdentifier]);

  useOrderStatusEvents({
    idOrNumero: orderIdentifier,
    enabled: Boolean(orderIdentifier) && !usePollingFallback,
    onStatusEvent: (event) => {
      applyStatusUpdate(event.statusId);
    },
    onError: () => {
      setUsePollingFallback(true);
    },
  });

  useEffect(() => {
    if (!orderIdentifier || !usePollingFallback) return;

    let active = true;
    const fetchStatus = async () => {
      try {
        const data = await apiRequest<PedidoStatusResponse>(
          `/pedido/status/${orderIdentifier}`,
          { method: "GET", authScope: "public" },
        );
        if (!active) return;
        applyStatusUpdate(data.statusId);
      } catch {
        if (!active) return;
      }
    };

    void fetchStatus();
    const interval = window.setInterval(fetchStatus, 60_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [applyStatusUpdate, orderIdentifier, usePollingFallback]);

  const statusIndex = useMemo(() => {
    if (!statusList.length || currentStatusId == null) return 0;
    const flowStatuses = statusList.filter((item) => item.value !== "cancelado");
    const index = flowStatuses.findIndex((item) => item.id === currentStatusId);
    return index >= 0 ? index : 0;
  }, [statusList, currentStatusId]);

  const statusLabel = useMemo(() => {
    if (!statusList.length || currentStatusId == null) return "Aguardando";
    return (
      statusList.find((item) => item.id === currentStatusId)?.label ??
      "Aguardando"
    );
  }, [statusList, currentStatusId]);

  const isCancelled = useMemo(
    () =>
      currentStatusId != null &&
      statusList.some(
        (item) => item.id === currentStatusId && item.value === "cancelado",
      ),
    [currentStatusId, statusList],
  );

  const isPreparando = useMemo(
    () =>
      currentStatusId != null &&
      statusList.some((s) => s.id === currentStatusId && s.value === "preparando"),
    [currentStatusId, statusList],
  );

  const flowStatuses = useMemo(
    () => statusList.filter((item) => item.value !== "cancelado"),
    [statusList],
  );

  const etaTime = useMemo(() => {
    const tempo = storeInfo?.tempoMedioPreparo;
    if (!tempo || !acceptedAt) return null;
    const ms = new Date(acceptedAt).getTime();
    if (Number.isNaN(ms)) return null;
    return new Date(ms + tempo * 60_000);
  }, [storeInfo, acceptedAt]);

  if (!order) {
    return (
      <div className="rounded-[var(--radius-sm)] bg-[color:var(--color-white)] p-4 text-sm text-[color:var(--color-blue-800)] shadow-[var(--shadow-soft)]">
        Nenhum pedido recente encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:space-y-0">
      <div className="space-y-6">
        <section className="space-y-3">
          <p className="text-base font-semibold text-[color:var(--color-blue-800)]/75">
            {statusLabel}
          </p>
          <p className="text-sm text-[color:var(--color-blue-800)]/70">
            {isCancelled ? "Pedido encerrado pela loja" : "Status atualizado"}
          </p>
          <div className="flex items-center gap-2 pt-2">
            {isCancelled ? (
              <span className="rounded-full bg-[color:var(--color-status-danger)]/12 px-4 py-2 text-xs font-bold text-[color:var(--color-status-danger)]">
                Cancelado
              </span>
            ) : flowStatuses.length > 0
              ? flowStatuses.map((status, index) => (
                  <span
                    key={status.id}
                    className={`h-3 w-12 rounded-full ${
                      index < statusIndex
                        ? "bg-[color:var(--color-status-success)]"
                        : index === statusIndex
                        ? "animate-pulse bg-[color:var(--color-status-success)]"
                        : "border border-[color:var(--color-status-success)]/50 bg-[color:var(--color-white)]"
                    }`}
                  />
                ))
              : Array.from({ length: 4 }).map((_, index) => (
                  <span
                    key={`step-${index}`}
                    className="h-3 w-12 rounded-full border border-[color:var(--color-status-success)]/50 bg-[color:var(--color-white)]"
                  />
                ))}
          </div>
        </section>

        {isPreparando && storeInfo?.tempoMedioPreparo ? (
          <section className="rounded-[var(--radius-sm)] bg-[color:var(--color-status-info)]/8 px-4 py-3">
            <p className="text-xs font-semibold text-[color:var(--color-blue-800)]/60">
              Tempo estimado de preparo
            </p>
            <p className="text-base font-bold text-[color:var(--color-blue-800)]">
              ~{storeInfo.tempoMedioPreparo} min
            </p>
            {etaTime ? (
              <p className="mt-1 text-xs text-[color:var(--color-blue-800)]/60">
                Previsao de finalizacao:{" "}
                <span className="font-semibold">
                  {etaTime.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-[var(--radius-sm)] bg-[color:var(--color-white)] p-4 shadow-[var(--shadow-soft-lg)]">
          <div className="space-y-2">
            <p className="text-xs text-[color:var(--color-gray-500)]">
              {new Date(order.createdAt).toLocaleString("pt-BR")}
            </p>
            <p className="text-lg font-extrabold text-[color:var(--color-blue-800)]">
              Pedido #{order.pedidoNumero ?? order.pedidoId}
            </p>
            <p className="text-sm text-[color:var(--color-blue-800)]/70">
              Mesa {order.mesa ?? "-"}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {order.items.map((item, index) => (
              <div
                key={`${item.productId}-${index}`}
                className="rounded-[var(--radius-sm)] bg-[color:var(--color-gray-50)] px-4 py-3 text-sm text-[color:var(--color-blue-800)]"
              >
                <p className="font-bold">{item.nome}</p>
                {item.additionals.length > 0 ? (
                  <p className="text-xs text-[color:var(--color-blue-800)]/70">
                    Adicionais: {item.additionals.map((add) => add.nome).join(", ")}
                  </p>
                ) : null}
                {item.observacao ? (
                  <p className="text-xs text-[color:var(--color-blue-800)]/70">
                    Obs: {item.observacao}
                  </p>
                ) : null}
                <p className="text-xs font-semibold">R$ {item.preco.replace(".", ",")}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-sm font-bold text-[color:var(--color-blue-800)]">
            <span>Total</span>
            <span>R$ {order.total.replace(".", ",")}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
