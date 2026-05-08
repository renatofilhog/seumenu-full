"use client";

import { useEffect } from "react";

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
};

export function usePedidoEvents({
  enabled = true,
  onPedidoEvent,
  onError,
}: UsePedidoEventsOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const source = new EventSource("/painel/pedido/events");

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as PedidoEventPayload;
        if (!payload?.pedido?.id || !payload?.type) {
          return;
        }
        onPedidoEvent(payload);
      } catch {
        // Ignore malformed events and keep the stream open.
      }
    };

    source.onerror = () => {
      onError?.();
    };

    return () => {
      source.close();
    };
  }, [enabled, onError, onPedidoEvent]);
}
