"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { API_BASE_URL } from "../../lib/api";
import { loadCart, saveCart, type CartItem } from "./cartStorage";

type Additional = {
  id: number;
  nome: string;
  quantidadeMax: number;
  preco: string;
  ativo: boolean;
};

type Product = {
  id: number;
  nome: string;
  descricao: string;
  preco: string;
  ativo: boolean;
  destaque: boolean;
  imagemUrl?: string;
  additionals?: Additional[];
};

type ProductDetailClientProps = {
  productId: string;
};

function withApiPrefix(url?: string): string {
  if (!url) return "/brand/pizza1.jpg";
  return url.startsWith("/") ? `${API_BASE_URL}${url}` : url;
}

export function ProductDetailClient({ productId }: ProductDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromCart = searchParams.get("from") === "carrinho";
  const cartIndexParam = searchParams.get("index");
  const cartIndex =
    cartIndexParam && !Number.isNaN(Number(cartIndexParam))
      ? Number(cartIndexParam)
      : null;
  const [product] = useState<Product | null>(() => {
    try {
      const raw = sessionStorage.getItem("seumenu_products");
      if (!raw) return null;
      const data = JSON.parse(raw) as Product[];
      return data.find((item) => String(item.id) === String(productId)) ?? null;
    } catch {
      return null;
    }
  });

  const cartContext = useMemo(() => {
    if (!fromCart || cartIndex === null) return null;
    const cart = loadCart();
    const item = cart?.items?.[cartIndex] ?? null;
    return item && item.productId === Number(productId) ? item : null;
  }, [fromCart, cartIndex, productId]);

  const [observacaoValue, setObservacaoValue] = useState(
    cartContext?.observacao ?? "",
  );
  const [selectedAdditionalsValue, setSelectedAdditionalsValue] = useState<
    number[]
  >(cartContext?.additionalIds ?? []);

  const additionals = useMemo(() => {
    return (product?.additionals ?? []).filter((item) => item.ativo);
  }, [product]);

  function toggleAdditional(id: number) {
    setSelectedAdditionalsValue((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  if (!product) {
    return (
      <div className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 text-sm text-[color:var(--color-blue-800)] shadow-[var(--shadow-soft)]">
        Produto nao encontrado. Volte ao cardapio e selecione novamente.
        <div className="mt-4">
          <Link
            href="/"
            className="rounded-full bg-[color:var(--color-blue-800)] px-4 py-2 text-xs font-semibold text-white"
          >
            Voltar ao cardapio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-4 shadow-[var(--shadow-soft)]">
        <div className="relative h-[260px] w-full overflow-hidden rounded-[var(--radius-md)]">
          <Image
            src={withApiPrefix(product.imagemUrl)}
            alt={product.nome}
            fill
            className="object-cover object-center"
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[color:var(--color-blue-800)]">
              {product.nome}
            </h2>
            <p className="text-sm text-[color:var(--color-blue-800)]/70">
              {product.descricao}
            </p>
          </div>
          <span className="text-lg font-extrabold text-[color:var(--color-blue-800)]">
            R$ {product.preco.replace(".", ",")}
          </span>
        </div>
      </section>

      {additionals.length > 0 ? (
        <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-4 shadow-[var(--shadow-soft)]">
          <h3 className="text-sm font-extrabold text-[color:var(--color-blue-800)]">
            Adicionais
          </h3>
          <div className="mt-3 grid gap-2">
            {additionals.map((additional) => (
              <label
                key={additional.id}
                className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[color:var(--color-blue-800)]/10 bg-[color:var(--color-gray-50)] px-3 py-2 text-xs text-[color:var(--color-blue-800)]"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedAdditionalsValue.includes(additional.id)}
                    onChange={() => toggleAdditional(additional.id)}
                  />
                  <span>{additional.nome}</span>
                </div>
                <span className="font-semibold">R$ {additional.preco.replace(".", ",")}</span>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-4 shadow-[var(--shadow-soft)]">
        <h3 className="text-sm font-extrabold text-[color:var(--color-blue-800)]">
          Observacoes
        </h3>
        <textarea
          className="mt-3 min-h-[110px] w-full rounded-[var(--radius-sm)] border border-[color:var(--color-blue-800)]/10 bg-[color:var(--color-gray-50)] px-3 py-2 text-sm text-[color:var(--color-blue-800)] outline-none"
          placeholder="Ex: sem cebola, molho a parte..."
          value={observacaoValue}
          onChange={(event) => setObservacaoValue(event.target.value)}
        />
      </section>

      {fromCart ? (
        <button
          type="button"
          className="w-full rounded-full bg-[color:var(--color-status-success)] px-6 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-soft)]"
          onClick={() => {
            if (!product) return;
            const selected = additionals.filter((additional) =>
              selectedAdditionalsValue.includes(additional.id),
            );
            const cart = loadCart();
            const nextItem: CartItem = {
              productId: product.id,
              nome: product.nome,
              preco: product.preco,
              imagemUrl: product.imagemUrl,
              additionalIds: selectedAdditionalsValue,
              additionals: selected.map((item) => ({
                id: item.id,
                nome: item.nome,
                preco: item.preco,
              })),
              observacao: observacaoValue,
            };

            if (cartIndex !== null && cart) {
              const items = [...cart.items];
              items[cartIndex] = nextItem;
              saveCart({ items, mesa: cart.mesa });
              router.push("/cliente/carrinho");
            }
          }}
        >
          Atualizar pedido
        </button>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="w-full rounded-full border border-[color:var(--color-blue-800)]/20 bg-white px-6 py-3 text-sm font-extrabold text-[color:var(--color-blue-800)] shadow-[var(--shadow-soft)]"
            onClick={() => {
              if (!product) return;
              const selected = additionals.filter((additional) =>
                selectedAdditionalsValue.includes(additional.id),
              );
              const cart = loadCart();
              const nextItem: CartItem = {
                productId: product.id,
                nome: product.nome,
                preco: product.preco,
                imagemUrl: product.imagemUrl,
                additionalIds: selectedAdditionalsValue,
                additionals: selected.map((item) => ({
                  id: item.id,
                  nome: item.nome,
                  preco: item.preco,
                })),
                observacao: observacaoValue,
              };
              const items = cart?.items ? [...cart.items, nextItem] : [nextItem];
              saveCart({ items, mesa: cart?.mesa });
              router.push("/");
            }}
          >
            Adicionar ao carrinho
          </button>
          <button
            type="button"
            className="w-full rounded-full bg-[color:var(--color-status-success)] px-6 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-soft)]"
            onClick={() => {
              if (!product) return;
              const selected = additionals.filter((additional) =>
                selectedAdditionalsValue.includes(additional.id),
              );
              const cart = loadCart();
              const nextItem: CartItem = {
                productId: product.id,
                nome: product.nome,
                preco: product.preco,
                imagemUrl: product.imagemUrl,
                additionalIds: selectedAdditionalsValue,
                additionals: selected.map((item) => ({
                  id: item.id,
                  nome: item.nome,
                  preco: item.preco,
                })),
                observacao: observacaoValue,
              };
              const items = cart?.items ? [...cart.items, nextItem] : [nextItem];
              saveCart({ items, mesa: cart?.mesa });
              router.push("/cliente/carrinho");
            }}
          >
            Adicionar ao carrinho e finalizar
          </button>
        </div>
      )}
    </div>
  );
}
