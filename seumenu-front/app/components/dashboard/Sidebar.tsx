"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AUTH_TOKEN_COOKIE,
  AUTH_USER_STORAGE,
  SAAS_AUTH_TOKEN_COOKIE,
  SAAS_AUTH_USER_STORAGE,
  TENANT_CONTEXT_COOKIE,
  apiRequest,
} from "../../lib/api";

type NavItem = {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
};

type SidebarProps = {
  variant?: "desktop" | "mobile";
  scope?: "app" | "saas";
};

const appNavItems: NavItem[] = [
  { label: "Resumo", href: "/painel" },
  {
    label: "Operacao",
    children: [
      { label: "Pedidos Kanban", href: "/painel/pedido" },
      { label: "Todos os Pedidos", href: "/painel/pedidosTable" },
      { label: "Mesas", href: "/painel/mesas" },
    ],
  },
  {
    label: "Cardapio",
    children: [{ label: "Produtos", href: "/painel/cardapio/produtos" }],
  },
  {
    label: "Configuracoes",
    children: [{ label: "Loja", href: "/painel/configuracoes/loja" }],
  },
  {
    label: "Acessos",
    children: [
      { label: "Gestao", href: "/painel/acessos" },
      { label: "Minha Senha", href: "/painel/minha-senha" },
    ],
  },
];

const saasNavItems: NavItem[] = [
  {
    label: "Clientes SaaS",
    children: [
      { label: "Clientes (Tenants)", href: "/smmanageapps/clientes/tenants" },
      { label: "Modelos de Licenca", href: "/smmanageapps/clientes/modelos-licenca" },
      { label: "Usuarios", href: "/smmanageapps/clientes/usuarios" },
      { label: "Criar Tenant", href: "/smmanageapps/clientes/criar-tenant-assistido" },
    ],
  },
  {
    label: "Acesso SaaS",
    children: [
      { label: "Usuarios SaaS", href: "/smmanageapps/acessos/usuarios-saas" },
      { label: "Minha Senha", href: "/smmanageapps/acessos/minha-senha" },
    ],
  },
];

export function Sidebar({ variant = "desktop", scope = "app" }: SidebarProps) {
  const navItems = scope === "saas" ? saasNavItems : appNavItems;
  const pathname = usePathname();
  const router = useRouter();
  const [tenantName, setTenantName] = useState<string | null>(null);
  const defaultOpen = useMemo(() => {
    const map: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (!item.children) return;
      const matches = item.children.some((child) =>
        pathname.startsWith(child.href)
      );
      if (matches) {
        map[item.label] = true;
      }
    });
    return map;
  }, [pathname]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (scope !== "app") {
      setTenantName(null);
      return;
    }

    let mounted = true;

    async function loadTenantName() {
      try {
        const tenant = await apiRequest<{ nome?: string }>("/tenant/resolve", {
          method: "GET",
        });
        if (mounted) {
          setTenantName(tenant?.nome?.trim() || null);
        }
      } catch {
        if (mounted) {
          setTenantName(null);
        }
      }
    }

    void loadTenantName();
    return () => {
      mounted = false;
    };
  }, [scope]);

  function handleLogout() {
    const authCookie = scope === "saas" ? SAAS_AUTH_TOKEN_COOKIE : AUTH_TOKEN_COOKIE;
    const authStorage = scope === "saas" ? SAAS_AUTH_USER_STORAGE : AUTH_USER_STORAGE;
    const loginPath = scope === "saas" ? "/smmanageapps/login" : "/painel/login";
    document.cookie = `${authCookie}=; Path=/; Max-Age=0; SameSite=Lax`;
    if (scope === "app") {
      document.cookie = `${TENANT_CONTEXT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
    localStorage.removeItem(authStorage);
    sessionStorage.removeItem(authStorage);
    router.replace(loginPath);
  }

  const baseClasses =
    "w-full flex-col gap-6 rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]";
  const desktopClasses =
    "hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:h-screen lg:w-[280px] lg:overflow-y-auto lg:rounded-none lg:pt-8 lg:pb-6 lg:px-6";
  const mobileClasses = "flex";

  return (
    <aside
      className={`${baseClasses} ${
        variant === "desktop" ? desktopClasses : mobileClasses
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--brand-navy)]/10">
          <Image
            src="/brand/LogoSeuMenu.png"
            alt="Logo Seu Menu"
            width={36}
            height={36}
            loading="eager"
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--brand-navy)]/60">
            {scope === "saas"
              ? "Seu Menu"
              : tenantName
                ? `Seu Menu - ${tenantName}`
                : "Seu Menu"}
          </p>
          <h1 className="text-lg font-semibold text-[color:var(--brand-navy)]">
            {scope === "saas" ? "Painel SaaS" : "Painel Mantenedor"}
          </h1>
        </div>
      </div>

      <nav className="flex flex-col gap-2 text-sm">
        {navItems.map((item) => {
          if (!item.children) {
            return (
              <Link
                key={item.label}
                href={item.href ?? "#"}
                className="flex items-center justify-between rounded-full border border-transparent px-4 py-2 text-left text-[color:var(--brand-ink)] transition hover:border-[color:var(--brand-green)]/40 hover:bg-[color:var(--brand-green)]/10"
              >
                <span>{item.label}</span>
                <span className="h-2 w-2 rounded-full bg-[color:var(--brand-green)]/40" />
              </Link>
            );
          }

          const isOpen = openSections[item.label] ?? defaultOpen[item.label];

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-[color:var(--brand-navy)]/10 bg-[color:var(--brand-navy)]/5 p-2"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenSections((prev) => ({
                    ...prev,
                    [item.label]: !prev[item.label],
                  }))
                }
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[color:var(--brand-navy)]"
                aria-expanded={isOpen ? "true" : "false"}
              >
                <span className="text-sm font-semibold">{item.label}</span>
                <span
                  className={`text-xs transition ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  v
                </span>
              </button>

              <div
                className={`grid transition-all ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-1 px-2 pb-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="flex items-center justify-between rounded-full border border-transparent px-3 py-2 text-xs text-[color:var(--brand-ink)] transition hover:border-[color:var(--brand-green)]/40 hover:bg-[color:var(--brand-green)]/10"
                      >
                        <span>{child.label}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand-green)]/40" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-[color:var(--brand-navy)]/10 bg-[color:var(--brand-navy)]/5 p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--brand-navy)]/70">
          Status
        </p>
        <p className="mt-2 text-sm text-[color:var(--brand-ink)]">
          Stream em tempo real ativo
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[color:var(--brand-green)]" />
          <span className="text-xs text-[color:var(--brand-navy)]/70">
            Ultima atualizacao: 12:46
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-full rounded-full border border-[color:var(--brand-red)]/30 bg-[color:var(--brand-red)]/10 px-4 py-2 text-xs font-semibold text-[color:var(--brand-ink)]"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
