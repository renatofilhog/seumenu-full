"use client";

import { useEffect } from "react";

export type OrderStatusEventPayload = {
  pedidoId: number;
  numero: number;
  statusId: number | null;
  type: "created" | "updated";
};

type UseOrderStatusEventsOptions = {
  idOrNumero?: number | string | null;
  enabled?: boolean;
  onStatusEvent: (event: OrderStatusEventPayload) => void;
  onError?: () => void;
};

export function useOrderStatusEvents({
  idOrNumero,
  enabled = true,
  onStatusEvent,
  onError,
}: UseOrderStatusEventsOptions) {
  useEffect(() => {
    if (!enabled || !idOrNumero) {
      return;
    }

    const source = new EventSource(
      `/cliente/pedido/events?idOrNumero=${encodeURIComponent(String(idOrNumero))}`,
    );

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as OrderStatusEventPayload;
        if (!payload?.pedidoId || payload.statusId == null) {
          return;
        }
        onStatusEvent(payload);
      } catch {
        // Ignore malformed events and keep the stream open.
      }
    };

    source.onerror = () => {
      onError?.();
      source.close();
    };

    return () => {
      source.close();
    };
  }, [enabled, idOrNumero, onError, onStatusEvent]);
}
