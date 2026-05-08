"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, apiRequest } from "../../lib/api";
import { BrandLoading } from "../shared/BrandLoading";
import { useStoreInfo } from "./storeContext";
import { loadCart, saveCart } from "./cartStorage";

type ProductGroup = {
  id: number;
  nome: string;
  ativo: boolean;
  ordem: number;
};

type Product = {
  id: number;
  nome: string;
  descricao: string;
  preco: string;
  ativo: boolean;
  destaque: boolean;
  imagemUrl?: string;
  ordem?: number | null;
  grupos: ProductGroup[];
};

type Category = {
  id: string;
  label: string;
  active: boolean;
};

function withApiPrefix(url?: string): string {
  if (!url) return "/brand/pizza1.jpg";
  return url.startsWith("/") ? `${API_BASE_URL}${url}` : url;
}

export function ClienteHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const storeInfo = useStoreInfo();
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("todos");

  useEffect(() => {
    let active = true;
    apiRequest<Product[]>("/product", { method: "GET", authScope: "public" })
      .then((data) => {
        if (!active) return;
        setProducts(data);
        try {
          sessionStorage.setItem("seumenu_products", JSON.stringify(data));
        } catch {
          // ignore storage failures
        }
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const mesaParam = params?.get("mesa");
    if (!mesaParam) return;
    const mesaId = Number(mesaParam);
    if (Number.isNaN(mesaId)) return;

    let active = true;
    apiRequest<{ id: number; numero: number; ativo: boolean }[]>("/mesa", {
      method: "GET",
      authScope: "public",
    })
      .then((data) => {
        if (!active) return;
        const mesaValida = data.find(
          (mesa) => mesa.ativo && mesa.id === mesaId,
        );
        if (!mesaValida) return;
        try {
          sessionStorage.setItem("seumenu_mesa_id", String(mesaId));
        } catch {
          // ignore
        }
        const cart = loadCart();
        saveCart({
          items: cart?.items ?? [],
          mesa: mesaId,
        });
      })
      .catch(() => {
        // ignore
      });

    return () => {
      active = false;
    };
  }, []);


  const categories = useMemo<Category[]>(() => {
    const groupNames = new Map<string, string>();
    products.forEach((product) => {
      product.grupos?.forEach((group) => {
        if (!groupNames.has(group.nome)) {
          groupNames.set(group.nome, group.nome);
        }
      });
    });

    const groupList = Array.from(groupNames.values()).map((label) => ({
      id: label.toLowerCase(),
      label,
      active: false,
    }));

    return [
      { id: "todos", label: "Todos", active: activeCategory === "todos" },
      ...groupList.map((item) => ({
        ...item,
        active: activeCategory === item.id,
      })),
    ];
  }, [products, activeCategory]);

  const filteredProducts = useMemo(() => {
    const ativos = products.filter((product) => product.ativo);
    if (activeCategory === "todos") {
      return ativos;
    }

    return ativos.filter((product) =>
      product.grupos?.some(
        (group) => group.nome.toLowerCase() === activeCategory,
      ),
    );
  }, [products, activeCategory]);

  const destaqueProducts = useMemo(() => {
    return products.filter((product) => product.ativo && product.destaque);
  }, [products]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const groupA = a.grupos?.[0]?.ordem ?? 999;
      const groupB = b.grupos?.[0]?.ordem ?? 999;
      if (groupA !== groupB) return groupA - groupB;
      const ordemA = a.ordem ?? 999;
      const ordemB = b.ordem ?? 999;
      return ordemA - ordemB;
    });
  }, [filteredProducts]);

  return (
    <>
      <section className="-mt-2">
        <div className="rounded-[var(--radius-sm)] bg-[color:var(--color-white)] px-8 py-1 text-center text-xs font-semibold text-[color:var(--color-blue-800)] shadow-[var(--shadow-soft)] lg:mx-auto lg:max-w-2xl lg:text-sm">
          {storeInfo?.horarioFuncionamento
            ? storeInfo.horarioFuncionamento
            : "Aberto ate 00h00"}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-2xl font-extrabold text-[color:var(--color-blue-800)]">
          Destaque
        </h2>
        <div className="mt-3 flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible">
          {loading ? (
            <div className="rounded-[var(--radius-sm)] bg-[color:var(--color-white)] px-6 py-4 shadow-[var(--shadow-soft)]">
              <BrandLoading size="sm" />
            </div>
          ) : null}
          {!loading && destaqueProducts.length === 0 ? (
            <div className="rounded-[var(--radius-sm)] bg-[color:var(--color-white)] px-6 py-4 text-xs text-[color:var(--color-blue-800)]/70 shadow-[var(--shadow-soft)]">
              Nenhum destaque disponivel.
            </div>
          ) : null}
          {destaqueProducts.map((item) => (
            <Link
              key={item.id}
              href={`/produto/${item.id}`}
              className="w-[210px] flex-none rounded-[var(--radius-sm)] bg-[color:var(--color-white)] p-3 shadow-[var(--shadow-soft-lg)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft-lg)] lg:w-auto"
            >
              <div className="relative h-[120px] overflow-hidden rounded-[var(--radius-sm)]">
                <Image
                  src={withApiPrefix(item.imagemUrl)}
                  alt={item.nome}
                  width={194}
                  height={120}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-[color:var(--color-blue-800)]">
                    {item.nome}
                  </p>
                  <p className="text-xs text-[color:var(--color-blue-800)]/70">
                    {item.descricao}
                  </p>
                  <p className="text-sm font-bold text-[color:var(--color-blue-800)]">
                    R$ {item.preco.replace(".", ",")}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Adicionar ao carrinho"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(155,182,216,0.15)]"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="var(--color-blue-800)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex gap-3 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`rounded-[var(--radius-sm)] px-3 py-2 text-sm font-bold shadow-[var(--shadow-soft)] ${
                cat.active
                  ? "bg-[rgba(47,213,115,0.15)] text-[color:var(--color-status-success)]"
                  : "bg-[color:var(--color-white)] text-[color:var(--color-blue-800)]"
              }`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {loading ? (
          <div className="rounded-[var(--radius-sm)] bg-[color:var(--color-white)] p-4 shadow-[var(--shadow-soft-lg)]">
            <BrandLoading size="sm" />
          </div>
        ) : null}
        {!loading && sortedProducts.length === 0 ? (
          <div className="rounded-[var(--radius-sm)] bg-[color:var(--color-white)] p-4 text-xs text-[color:var(--color-blue-800)]/70 shadow-[var(--shadow-soft-lg)]">
            Nenhum produto disponivel.
          </div>
        ) : null}
        {sortedProducts.map((item) => (
          <Link
            key={item.id}
            href={`/produto/${item.id}`}
            className="flex items-center gap-4 rounded-[var(--radius-sm)] bg-[color:var(--color-white)] p-4 shadow-[var(--shadow-soft-lg)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft-lg)]"
          >
            <div className="relative h-[134px] w-[194px] overflow-hidden rounded-[var(--radius-sm)]">
              <Image
                src={withApiPrefix(item.imagemUrl)}
                alt={item.nome}
                width={194}
                height={134}
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className="flex-1">
              <p className="text-base font-extrabold text-[color:var(--color-blue-800)]">
                {item.nome}
              </p>
              <p className="text-xs text-[color:var(--color-blue-800)]/70">
                {item.descricao}
              </p>
              <p className="text-sm font-bold text-[color:var(--color-blue-800)]">
                R$ {item.preco.replace(".", ",")}
              </p>
            </div>
            <button
              type="button"
              aria-label="Adicionar ao carrinho"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(155,182,216,0.15)]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke="var(--color-blue-800)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                </svg>
            </button>
          </Link>
        ))}
      </section>
    </>
  );
}
