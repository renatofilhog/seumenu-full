"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";
import {
  DEFAULT_CART_TTL_MINUTES,
  loadCart,
  saveCart,
  type CartItem,
} from "./cartStorage";
import { saveOrder } from "./orderStorage";

type Mesa = {
  id: number;
  numero: number;
  descricao: string;
  setor: string;
  ativo: boolean;
};

type StoreConfig = {
  habilitaVerificacaoMesa?: boolean;
};

type PedidoRecenteResponse = {
  hasPedidoRecente: boolean;
  id?: number;
};

type PedidoItemPayload = {
  produtoId: number;
  additionalIds: number[];
  valorUnit: string;
  qtSolicitada: number;
  vlDesconto: string;
  vlTotal: string;
  observacao?: string;
};

type PaymentMethod = "pix" | "dinheiro" | "credito" | "debito";

const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "credito", label: "Credito" },
  { value: "debito", label: "Debito" },
];

function parsePrice(value: string): number {
  const normalized = value.replace(/[^\d.,]/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function CartClient() {
  const searchParams = useSearchParams();
  const mesaParam = searchParams.get("mesa");
  const mesaFixed = mesaParam ? Number(mesaParam) : null;
  const initialCart = useMemo(() => loadCart(), []);
  const [cartItems, setCartItems] = useState<CartItem[]>(
    initialCart?.items ?? [],
  );
  const [mesa, setMesa] = useState<number | null>(
    mesaFixed ?? initialCart?.mesa ?? null,
  );
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const resolveMesaByValue = useCallback(
    (value: number | null | undefined) => {
      if (!value) return null;
      return (
        mesas.find((item) => item.id === value) ??
        mesas.find((item) => item.numero === value) ??
        null
      );
    },
    [mesas],
  );
  const selectedMesa = useMemo(
    () => resolveMesaByValue(mesaFixed ?? mesa ?? undefined),
    [mesaFixed, mesa, resolveMesaByValue],
  );
  const mesaError = useMemo(() => {
    if (!mesaFixed) return null;
    const isValid = mesas.some((item) => item.id === mesaFixed);
    return isValid ? null : "Mesa informada nao esta disponivel.";
  }, [mesaFixed, mesas]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [hasPedidoRecente, setHasPedidoRecente] = useState(false);
  const [pedidoRecenteId, setPedidoRecenteId] = useState<number | null>(null);
  const [vincularPedidoRecente, setVincularPedidoRecente] = useState(false);
  const [finalizarErro, setFinalizarErro] = useState<string | null>(null);
  const [finalizando, setFinalizando] = useState(false);
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod | "">("");

  useEffect(() => {
    let active = true;
    apiRequest<Mesa[]>("/mesa", { method: "GET", authScope: "public" })
      .then((data) => {
        if (!active) return;
        const activeMesas = data.filter((item) => item.ativo);
        setMesas(activeMesas);
        try {
          sessionStorage.setItem("seumenu_mesas", JSON.stringify(activeMesas));
        } catch {
          // ignore
        }
      })
      .catch(() => {
        if (!active) return;
        setMesas([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest<StoreConfig[]>("/store", { method: "GET", authScope: "public" })
      .then((data) => {
        if (!active) return;
        setStoreConfig(data[0] ?? null);
      })
      .catch(() => {
        if (!active) return;
        setStoreConfig(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    saveCart(
      {
        items: cartItems,
        mesa: selectedMesa?.id ?? mesaFixed ?? mesa ?? undefined,
      },
      DEFAULT_CART_TTL_MINUTES,
    );
  }, [cartItems, mesa, mesaFixed, selectedMesa]);

  const mesaId = useMemo(() => {
    return selectedMesa?.id ?? null;
  }, [selectedMesa]);

  useEffect(() => {
    if (!storeConfig?.habilitaVerificacaoMesa || !mesaId) {
      setHasPedidoRecente(false);
      setPedidoRecenteId(null);
      setVincularPedidoRecente(false);
      return;
    }

    let active = true;
    apiRequest<PedidoRecenteResponse>(`/mesa/${mesaId}/tem-pedido-recente`, {
      method: "GET",
      authScope: "public",
    })
      .then((data) => {
        if (!active) return;
        setHasPedidoRecente(Boolean(data.hasPedidoRecente));
        setPedidoRecenteId(data.id ?? null);
        if (!data.hasPedidoRecente) {
          setVincularPedidoRecente(false);
        }
      })
      .catch(() => {
        if (!active) return;
        setHasPedidoRecente(false);
        setPedidoRecenteId(null);
        setVincularPedidoRecente(false);
      });

    return () => {
      active = false;
    };
  }, [storeConfig?.habilitaVerificacaoMesa, mesaId]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const base = parsePrice(item.preco);
      const adicionalsTotal = item.additionals.reduce(
        (sum, add) => sum + parsePrice(add.preco),
        0,
      );
      return acc + base + adicionalsTotal;
    }, 0);
  }, [cartItems]);

  const itensPayload = useMemo<PedidoItemPayload[]>(() => {
    return cartItems.map((item) => {
      const unit = parsePrice(item.preco);
      const adicionalsTotal = item.additionals.reduce(
        (sum, add) => sum + parsePrice(add.preco),
        0,
      );
      const total = unit + adicionalsTotal;
      return {
        produtoId: item.productId,
        additionalIds: item.additionalIds,
        valorUnit: total.toFixed(2),
        qtSolicitada: 1,
        vlDesconto: "0",
        vlTotal: total.toFixed(2),
        observacao: item.observacao.trim() || undefined,
      };
    });
  }, [cartItems]);

  function handleRemove(index: number) {
    setCartItems((prev) => prev.filter((_, idx) => idx !== index));
  }

  const canSubmit =
    cartItems.length > 0 &&
    !mesaError &&
    Boolean(mesaId) &&
    nomeCliente.trim().length > 0 &&
    telefoneCliente.replace(/\D/g, "").length >= 10 &&
    Boolean(formaPagamento);

  return (
    <div className="space-y-8 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:space-y-0">
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-[color:var(--color-blue-800)]">
          Itens no carrinho
        </h2>

        {cartItems.length === 0 ? (
          <div className="rounded-[var(--radius-sm)] bg-[color:var(--color-white)] p-4 text-sm text-[color:var(--color-blue-800)]/70 shadow-[var(--shadow-soft)]">
            Seu carrinho esta vazio.
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item, index) => (
              <div
                key={`${item.productId}-${index}`}
                className="rounded-[var(--radius-sm)] bg-[color:var(--color-white)] p-4 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-[color:var(--color-blue-800)]">
                      {item.nome}
                    </p>
                    <p className="text-xs text-[color:var(--color-blue-800)]/70">
                      R$ {item.preco.replace(".", ",")}
                    </p>
                    {item.additionals.length > 0 ? (
                      <p className="mt-1 text-xs text-[color:var(--color-blue-800)]/60">
                        Adicionais:{" "}
                        {item.additionals.map((add) => add.nome).join(", ")}
                      </p>
                    ) : null}
                    {item.observacao ? (
                      <p className="mt-1 text-xs text-[color:var(--color-blue-800)]/60">
                        Obs: {item.observacao}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/produto/${item.productId}?from=carrinho&index=${index}${
                        mesaFixed ? `&mesa=${mesaFixed}` : ""
                      }`}
                      className="rounded-full bg-[color:var(--color-gray-50)] px-3 py-1 text-xs font-bold text-[color:var(--color-blue-800)]"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      aria-label="Remover item"
                      className="rounded-full bg-[color:var(--color-status-danger)]/10 px-3 py-1 text-xs font-bold text-[color:var(--color-status-danger)]"
                      onClick={() => handleRemove(index)}
                    >
                      Lixeira
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-[color:var(--color-blue-800)]">
            Resumo de valores
          </h2>
          <div className="space-y-2 text-sm font-bold text-[color:var(--color-gray-300)]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Desconto</span>
              <span>{formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-[color:var(--color-gray-500)]">
              <span>Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-extrabold text-[color:var(--color-blue-800)]">
            Mesa
          </h3>
          {mesaFixed ? (
            <div className="rounded-[var(--radius-sm)] bg-[color:var(--color-white)] px-6 py-3 text-sm font-bold text-[color:var(--color-blue-800)] shadow-[var(--shadow-soft)]">
              {selectedMesa?.numero
                ? `Mesa ${selectedMesa.numero}`
                : `Mesa ${mesaFixed}`}
            </div>
          ) : (
            <select
              className="w-full rounded-[var(--radius-sm)] bg-[color:var(--color-white)] px-6 py-3 text-sm font-bold text-[color:var(--color-blue-800)] shadow-[var(--shadow-soft)]"
              value={selectedMesa?.id ?? ""}
              onChange={(event) =>
                setMesa(event.target.value ? Number(event.target.value) : null)
              }
            >
              <option value="">Selecione uma mesa</option>
              {mesas.map((item) => (
                <option key={item.id} value={item.id}>
                  Mesa {item.numero} - {item.setor}
                </option>
              ))}
            </select>
          )}
          {mesaError ? (
            <p className="text-xs font-semibold text-[color:var(--color-status-danger)]">
              {mesaError}
            </p>
          ) : null}
        </div>

        {storeConfig?.habilitaVerificacaoMesa && hasPedidoRecente ? (
          <label className="flex items-start gap-3 rounded-[var(--radius-sm)] bg-[color:var(--color-white)] px-4 py-3 text-xs text-[color:var(--color-blue-800)] shadow-[var(--shadow-soft)]">
            <input
              type="checkbox"
              checked={vincularPedidoRecente}
              onChange={(event) => setVincularPedidoRecente(event.target.checked)}
            />
            <span>
              Vincular ao ultimo pedido desta mesa
            </span>
          </label>
        ) : null}

        <div className="space-y-3 rounded-[var(--radius-sm)] bg-[color:var(--color-white)] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="text-lg font-extrabold text-[color:var(--color-blue-800)]">
            Dados do cliente
          </h3>
          <label className="block text-xs font-semibold text-[color:var(--color-blue-800)]/75">
            Nome do cliente
            <input
              type="text"
              value={nomeCliente}
              onChange={(event) => setNomeCliente(event.target.value)}
              placeholder="Ex.: Joao"
              className="mt-2 w-full rounded-[var(--radius-sm)] border border-[color:var(--color-blue-800)]/10 bg-[color:var(--color-gray-50)] px-4 py-3 text-sm font-bold text-[color:var(--color-blue-800)] outline-none focus:ring-2 focus:ring-[color:var(--color-status-success)]/30"
            />
          </label>
          <label className="block text-xs font-semibold text-[color:var(--color-blue-800)]/75">
            Telefone
            <input
              type="tel"
              value={telefoneCliente}
              onChange={(event) =>
                setTelefoneCliente(formatPhoneInput(event.target.value))
              }
              placeholder="(99) 99999-9999"
              className="mt-2 w-full rounded-[var(--radius-sm)] border border-[color:var(--color-blue-800)]/10 bg-[color:var(--color-gray-50)] px-4 py-3 text-sm font-bold text-[color:var(--color-blue-800)] outline-none focus:ring-2 focus:ring-[color:var(--color-status-success)]/30"
            />
          </label>
          <label className="block text-xs font-semibold text-[color:var(--color-blue-800)]/75">
            Forma de pagamento
            <select
              value={formaPagamento}
              onChange={(event) =>
                setFormaPagamento(event.target.value as PaymentMethod | "")
              }
              className="mt-2 w-full rounded-[var(--radius-sm)] border border-[color:var(--color-blue-800)]/10 bg-[color:var(--color-gray-50)] px-4 py-3 text-sm font-bold text-[color:var(--color-blue-800)] outline-none focus:ring-2 focus:ring-[color:var(--color-status-success)]/30"
            >
              <option value="">Selecione</option>
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {finalizarErro ? (
          <div className="rounded-[var(--radius-sm)] bg-[color:var(--color-status-danger)]/10 px-4 py-2 text-xs font-semibold text-[color:var(--color-status-danger)]">
            {finalizarErro}
          </div>
        ) : null}

        <button
          type="button"
          className="w-full rounded-full bg-[color:var(--color-status-success)] px-6 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-soft)]"
          disabled={!canSubmit}
          onClick={async () => {
            if (finalizando) return;
            setFinalizarErro(null);

            if (!mesaId) {
              setFinalizarErro("Selecione uma mesa valida para continuar.");
              return;
            }
            if (itensPayload.length === 0) {
              setFinalizarErro("Carrinho vazio.");
              return;
            }
            if (!nomeCliente.trim()) {
              setFinalizarErro("Informe o nome do cliente.");
              return;
            }
            if (telefoneCliente.replace(/\D/g, "").length < 10) {
              setFinalizarErro("Informe um telefone valido.");
              return;
            }
            if (!formaPagamento) {
              setFinalizarErro("Selecione a forma de pagamento.");
              return;
            }
    if (
      storeConfig?.habilitaVerificacaoMesa &&
      hasPedidoRecente &&
      vincularPedidoRecente &&
      !pedidoRecenteId
    ) {
      setFinalizarErro(
        "Nao foi possivel identificar o ultimo pedido dessa mesa.",
      );
      return;
    }

            setFinalizando(true);
            try {
            if (
              storeConfig?.habilitaVerificacaoMesa &&
              hasPedidoRecente &&
              vincularPedidoRecente &&
              pedidoRecenteId
            ) {
              await apiRequest(`/pedido/numero/${pedidoRecenteId}/itens`, {
                method: "POST",
                body: JSON.stringify({ itens: itensPayload }),
                authScope: "public",
              });
              saveOrder({
                pedidoId: pedidoRecenteId,
                pedidoNumero: pedidoRecenteId,
                items: cartItems,
                mesa: mesaId,
                total: subtotal.toFixed(2),
                createdAt: new Date().toISOString(),
                nomeCliente: nomeCliente.trim(),
                telefoneCliente,
                formaPagamento,
              });
            } else {
              const response = (await apiRequest("/pedido", {
                method: "POST",
                body: JSON.stringify({
                  valorLiq: subtotal.toFixed(2),
                  valorDesc: "0",
                  valorTotal: subtotal.toFixed(2),
                  mesaId,
                  codCupom: "",
                  nomeCliente: nomeCliente.trim(),
                  telefoneCliente,
                  formaPagamento,
                  itens: itensPayload,
                }),
                authScope: "public",
              })) as { id?: number; numero?: number; statusId?: number };
              const pedidoId = response?.id ?? 0;
              const pedidoNumero = response?.numero ?? pedidoId;
              saveOrder({
                pedidoId,
                pedidoNumero,
                items: cartItems,
                mesa: mesaId,
                total: subtotal.toFixed(2),
                createdAt: new Date().toISOString(),
                statusId: response?.statusId,
                nomeCliente: nomeCliente.trim(),
                telefoneCliente,
                formaPagamento,
              });
              }
              saveCart({ items: [], mesa: mesaId ?? undefined });
              setCartItems([]);
              window.location.assign("/cliente/pedido");
            } catch (err) {
              setFinalizarErro(
                err instanceof Error ? err.message : "Erro ao finalizar pedido.",
              );
            } finally {
              setFinalizando(false);
            }
          }}
        >
          {finalizando ? "Finalizando..." : "Finalizar pedido"}
        </button>
      </section>
    </div>
  );
}
