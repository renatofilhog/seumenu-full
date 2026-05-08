export type CartAdditional = {
  id: number;
  nome: string;
  preco: string;
};

export type CartItem = {
  productId: number;
  nome: string;
  preco: string;
  imagemUrl?: string;
  additionalIds: number[];
  additionals: CartAdditional[];
  observacao: string;
};

export type CartState = {
  items: CartItem[];
  mesa?: number;
  expiresAt: number;
};

const CART_KEY = "seumenu_cart";
export const DEFAULT_CART_TTL_MINUTES = 60;

export function loadCart(): CartState | null {
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(CART_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveCart(
  cart: Omit<CartState, "expiresAt">,
  ttlMinutes: number = DEFAULT_CART_TTL_MINUTES,
) {
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
  sessionStorage.setItem(
    CART_KEY,
    JSON.stringify({
      ...cart,
      expiresAt,
    }),
  );
}

export function clearCart() {
  sessionStorage.removeItem(CART_KEY);
}
