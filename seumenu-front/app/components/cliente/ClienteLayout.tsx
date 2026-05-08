"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, ApiRequestError, apiRequest } from "../../lib/api";
import { BrandLoading } from "../shared/BrandLoading";
import { StoreProvider } from "./storeContext";

type Store = {
  id: number;
  nome: string;
  bannerUrl?: string;
  logoUrl?: string;
  corFundo?: string;
};

type ClienteLayoutProps = {
  title?: string;
  showBottomNav?: boolean;
  active?: "home" | "pedido" | "carrinho";
  showBackButton?: boolean;
  backHref?: string;
  children: React.ReactNode;
};

export function ClienteLayout({
  title,
  showBottomNav = true,
  active = "home",
  showBackButton = true,
  backHref,
  children,
}: ClienteLayoutProps) {
  const [store, setStore] = useState<Store | null>(null);
  const [tenantNotFound, setTenantNotFound] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const delay = (ms: number) =>
      new Promise((resolve) => {
        window.setTimeout(resolve, ms);
      });
    const loadTenantAndStore = async () => {
      try {
        await apiRequest("/tenant/resolve", { method: "GET", authScope: "public" });
        if (!active) return;
        setTenantNotFound(false);

        let data: Store[] | null = null;
        let lastError: unknown = null;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            data = await apiRequest<Store[]>("/store", {
              method: "GET",
              authScope: "public",
            });
            lastError = null;
            break;
          } catch (error) {
            lastError = error;
            if (
              error instanceof ApiRequestError
              && (error.status === 401 || error.status === 404)
            ) {
              throw error;
            }
            if (attempt < 2) {
              await delay(300 * (attempt + 1));
            }
          }
        }

        if (lastError) {
          throw lastError;
        }
        if (!active) return;
        setStore(data?.[0] ?? null);
      } catch (error) {
        if (!active) return;
        if (
          error instanceof ApiRequestError
          && (error.status === 401 || error.status === 404)
        ) {
          setTenantNotFound(true);
          setStore(null);
        } else {
          setStore(null);
        }
      } finally {
        if (active) {
          setTenantLoading(false);
        }
      }
    };

    void loadTenantAndStore();

    return () => {
      active = false;
    };
  }, []);

  const displayTitle = useMemo(() => title ?? store?.nome, [title, store?.nome]);

  if (tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-gray-50)] px-6">
        <BrandLoading size="lg" />
      </div>
    );
  }

  if (tenantNotFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-gray-50)] px-6">
        <section className="w-full max-w-xl rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-8 text-center shadow-[var(--shadow-soft)]">
          <img
            src="/brand/logo-vertical.png"
            alt="Mascote Seu Menu"
            className="mx-auto h-28 w-28 object-contain"
          />
          <h1 className="mt-4 text-2xl font-extrabold text-[color:var(--color-blue-800)]">
            Opa! Restaurante não encontrado (404)
          </h1>
          <p className="mt-3 text-sm text-[color:var(--color-blue-800)]/70">
            Não encontramos esse cardapio.
          </p>
          <p className="mt-1 text-xs text-[color:var(--color-blue-800)]/60">
            Verifique a URL ou entre em contato com o estabelecimento.
          </p>
        </section>
      </div>
    );
  }

  function normalizeMediaUrl(value?: string): string | null {
    const normalized = value?.trim();
    if (!normalized) return null;
    if (normalized === "undefined" || normalized === "null") return null;
    return normalized;
  }

  const bannerUrlValue = normalizeMediaUrl(store?.bannerUrl);
  const bannerUrl = bannerUrlValue
    ? bannerUrlValue.startsWith("/")
      ? `${API_BASE_URL}${bannerUrlValue}`
      : bannerUrlValue
    : null;
  const logoUrlValue = normalizeMediaUrl(store?.logoUrl);
  const logoUrl = logoUrlValue
    ? logoUrlValue.startsWith("/")
      ? `${API_BASE_URL}${logoUrlValue}`
      : logoUrlValue
    : "/brand/LogoSeuMenu.png";

  return (
    <div
      className="min-h-screen text-[color:var(--color-blue-800)]"
      style={{ backgroundColor: store?.corFundo || "var(--color-white)" }}
    >
      <header className="relative h-[190px] overflow-hidden lg:h-[260px]">
        <div
          className="absolute inset-x-0 top-0 h-[100px] bg-cover bg-center lg:h-[160px]"
          style={{
            backgroundImage: bannerUrl ? `url('${bannerUrl}')` : undefined,
          }}
        />
        {showBackButton ? (
          <button
            type="button"
            aria-label="Voltar"
            className="absolute right-6 top-8 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-[var(--shadow-soft)] lg:right-12 lg:top-12"
            onClick={() =>
              backHref ? router.push(backHref) : window.history.back()
            }
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M15 6l-6 6 6 6"
                stroke="var(--color-blue-800)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
        <div className="absolute left-6 top-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white shadow-[var(--shadow-soft-lg)] lg:left-12 lg:top-20 lg:h-32 lg:w-32">
          <Image
            src={logoUrl}
            alt={store?.nome ? `Logo ${store.nome}` : "Logo da loja"}
            fill
            sizes="(min-width: 1024px) 128px, 96px"
            className="object-cover object-center"
          />
        </div>
        {displayTitle ? (
          <div className="absolute left-6 top-[150px] flex flex-col gap-2 lg:left-12 lg:top-[210px]">
            <h1 className="text-2xl font-extrabold text-[color:var(--color-blue-800)] lg:text-3xl">
              {displayTitle}
            </h1>
          </div>
        ) : null}
      </header>

      <StoreProvider value={store}>
        <main className="mx-auto max-w-5xl px-4 pb-44 pt-4 lg:px-8 lg:pb-12 lg:pt-8 lg:pr-[140px]">
          {children}
        </main>
      </StoreProvider>

      {showBottomNav ? (
        <aside className="hidden lg:fixed lg:right-8 lg:top-[260px] lg:flex lg:w-[72px] lg:flex-col lg:gap-4">
          <Link
            href="/"
            className={`flex items-center justify-center rounded-2xl bg-[color:var(--color-white)] px-4 py-3 text-sm font-bold text-[color:var(--color-blue-800)] shadow-[var(--shadow-soft)] ${
              active === "home"
                ? "border border-[color:var(--color-status-success)]/40"
                : "border border-transparent"
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 11l8-7 8 7v7a2 2 0 0 1-2 2h-4v-6H10v6H6a2 2 0 0 1-2-2v-7Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            href="/cliente/carrinho"
            className={`flex items-center justify-center rounded-2xl bg-[color:var(--color-white)] px-4 py-3 text-sm font-bold text-[color:var(--color-blue-800)] shadow-[var(--shadow-soft)] ${
              active === "carrinho"
                ? "border border-[color:var(--color-status-success)]/40"
                : "border border-transparent"
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 6h14l-2 9H9L7 6Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="19" r="1.5" fill="currentColor" />
              <circle cx="18" cy="19" r="1.5" fill="currentColor" />
              <path d="M4 6h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
          <Link
            href="/cliente/pedido"
            className={`flex items-center justify-center rounded-2xl bg-[color:var(--color-white)] px-4 py-3 text-sm font-bold text-[color:var(--color-blue-800)] shadow-[var(--shadow-soft)] ${
              active === "pedido"
                ? "border border-[color:var(--color-status-success)]/40"
                : "border border-transparent"
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 7h10M7 12h10M7 17h6"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <rect
                x="4.5"
                y="4.5"
                width="15"
                height="15"
                rx="3"
                stroke="currentColor"
                strokeWidth="2.4"
              />
            </svg>
          </Link>
        </aside>
      ) : null}

      {showBottomNav ? (
        <nav className="fixed bottom-6 left-1/2 z-20 w-[88%] -translate-x-1/2 rounded-[var(--radius-pill)] bg-[color:var(--color-gray-50)] px-8 py-3 shadow-[var(--shadow-soft-lg)] lg:hidden">
          <div className="flex items-center justify-between text-[10px] font-bold text-[color:var(--color-blue-800)]">
            <Link href="/" className="flex flex-col items-center gap-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  active === "home"
                    ? "bg-[rgba(47,213,115,0.15)] text-[color:var(--color-status-success)]"
                    : ""
                }`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 11l8-7 8 7v7a2 2 0 0 1-2 2h-4v-6H10v6H6a2 2 0 0 1-2-2v-7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              Inicio
            </Link>
            <Link href="/cliente/carrinho" className="flex flex-col items-center gap-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  active === "carrinho"
                    ? "bg-[rgba(47,213,115,0.15)] text-[color:var(--color-status-success)]"
                    : ""
                }`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M7 7h10M7 12h10M7 17h6"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <rect
                    x="4.5"
                    y="4.5"
                    width="15"
                    height="15"
                    rx="3"
                    stroke="currentColor"
                    strokeWidth="2.4"
                  />
                </svg>
              </div>
              Carrinho
            </Link>
            <Link href="/cliente/pedido" className="flex flex-col items-center gap-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  active === "pedido"
                    ? "bg-[rgba(47,213,115,0.15)] text-[color:var(--color-status-success)]"
                    : ""
                }`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M7 6h14l-2 9H9L7 6Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="19" r="1.5" fill="currentColor" />
                  <circle cx="18" cy="19" r="1.5" fill="currentColor" />
                  <path
                    d="M4 6h2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              Pedidos
            </Link>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
