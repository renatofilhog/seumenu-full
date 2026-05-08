"use client";

import { useEffect, useRef, useState } from "react";

type Mesa = {
  numero: number;
  setor: string;
};

type PedidoItem = {
  id: number;
  qtSolicitada: number;
  valorUnit: string;
};

export type PedidoEventPedido = {
  id: number;
  numero: number;
  valorTotal: string;
  status: string | { value?: string };
  nomeCliente?: string;
  telefoneCliente?: string;
  formaPagamento?: string;
  mesa: Mesa;
  itens: PedidoItem[];
  data?: string;
  tenantId?: number;
};

export type PedidoEventPayload = {
  type: "created" | "updated";
  pedido: PedidoEventPedido;
};

type UsePedidoEventsOptions = {
  enabled?: boolean;
  onPedidoEvent: (event: PedidoEventPayload) => void;
  onError?: () => void;
  onReconnected?: () => void;
};

const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

export function usePedidoEvents({
  enabled = true,
  onPedidoEvent,
  onError,
  onReconnected,
}: UsePedidoEventsOptions): { connected: boolean } {
  const [connected, setConnected] = useState(false);

  // Stable refs so closures inside useEffect never go stale.
  const onPedidoEventRef = useRef(onPedidoEvent);
  const onErrorRef = useRef(onError);
  const onReconnectedRef = useRef(onReconnected);
  onPedidoEventRef.current = onPedidoEvent;
  onErrorRef.current = onError;
  onReconnectedRef.current = onReconnected;

  const sourceRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(BASE_BACKOFF_MS);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    activeRef.current = true;
    backoffRef.current = BASE_BACKOFF_MS;

    function close() {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.onopen = null;
        sourceRef.current.onmessage = null;
        sourceRef.current.onerror = null;
        sourceRef.current.close();
        sourceRef.current = null;
      }
    }

    function open(isReconnect: boolean) {
      close();

      const source = new EventSource("/painel/pedido/events");
      sourceRef.current = source;

      source.onopen = () => {
        if (!activeRef.current) return;
        backoffRef.current = BASE_BACKOFF_MS;
        setConnected(true);
        if (isReconnect) {
          onReconnectedRef.current?.();
        }
      };

      source.onmessage = (event) => {
        if (!activeRef.current) return;
        try {
          const payload = JSON.parse(event.data) as PedidoEventPayload;
          if (!payload?.pedido?.id || !payload?.type) return;
          onPedidoEventRef.current(payload);
        } catch {
          // Ignore malformed events and keep the stream open.
        }
      };

      source.onerror = () => {
        if (!activeRef.current) return;
        setConnected(false);
        onErrorRef.current?.();
        close();

        const delay = backoffRef.current;
        backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS);

        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          if (!activeRef.current) return;
          open(true);
        }, delay);
      };
    }

    function handleVisibility() {
      if (document.visibilityState !== "visible") return;
      const src = sourceRef.current;
      const isDisconnected = !src || src.readyState === EventSource.CLOSED;
      if (isDisconnected) {
        backoffRef.current = BASE_BACKOFF_MS;
        open(true);
      }
    }

    open(false);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      activeRef.current = false;
      setConnected(false);
      document.removeEventListener("visibilitychange", handleVisibility);
      close();
    };
  }, [enabled]);

  return { connected };
}
