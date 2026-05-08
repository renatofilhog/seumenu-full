import type { CartItem } from "./cartStorage";

export type OrderState = {
  pedidoId: number;
  pedidoNumero?: number;
  items: CartItem[];
  mesa?: number;
  total: string;
  createdAt: string;
  statusId?: number;
  acceptedAt?: string;
  nomeCliente?: string;
  telefoneCliente?: string;
  formaPagamento?: string;
};

const ORDER_KEY = "seumenu_order";
const ORDER_TTL_HOURS = 12;

export function loadOrder(): OrderState | null {
  try {
    const raw = sessionStorage.getItem(ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OrderState & { expiresAt?: number };
    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(ORDER_KEY);
      return null;
    }
    const rest = parsed as OrderState;
    return rest;
  } catch {
    return null;
  }
}

export function saveOrder(order: OrderState) {
  const expiresAt = Date.now() + ORDER_TTL_HOURS * 60 * 60 * 1000;
  sessionStorage.setItem(
    ORDER_KEY,
    JSON.stringify({
      ...order,
      expiresAt,
    }),
  );
}
