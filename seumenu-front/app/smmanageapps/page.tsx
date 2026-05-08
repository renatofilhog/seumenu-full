import Link from "next/link";
import { PageShell } from "../components/dashboard/PageShell";
import { SaasSummaryCards } from "./SaasSummaryCards";

export default function SmManageAppsHomePage() {
  return (
    <PageShell title="Resumo SaaS" scope="saas">
      <SaasSummaryCards />

      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--brand-navy)]/60">
          Guia Operacional
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[color:var(--brand-ink)]">
          Ativacao de Novo Cliente: fluxo atualizado
        </h2>
        <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
          Use preferencialmente o Wizard para reduzir erros e manter o provisionamento padronizado.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[var(--radius-md)] border border-[color:var(--brand-navy)]/10 bg-[color:var(--color-white)] p-5 shadow-[var(--shadow-soft)]">
          <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">1. Escolha o modo de criacao</h3>
          <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
            <strong>Recomendado:</strong> use <strong>Criar Tenant (Assistido)</strong> para fluxo em etapas com validacoes.
          </p>
          <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
            Alternativa: fluxo manual por telas separadas (tenants, licencas, usuarios e provisionamento).
          </p>
          <Link href="/smmanageapps/clientes/criar-tenant-assistido" className="mt-4 inline-flex rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white">
            Ir para Criar Tenant (Assistido)
          </Link>
        </article>

        <article className="rounded-[var(--radius-md)] border border-[color:var(--brand-navy)]/10 bg-[color:var(--color-white)] p-5 shadow-[var(--shadow-soft)]">
          <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">2. Fluxo manual (quando necessario)</h3>
          <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
            Se nao usar o Wizard, siga a ordem: <strong>Clientes (Tenants)</strong> → <strong>Modelos de Licenca/Licencas</strong> → <strong>Usuarios</strong> → <strong>Provisionamento</strong>.
          </p>
          <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
            Garanta dominio/subdominio/slug corretos para evitar problemas de acesso e CORS por tenant.
          </p>
          <Link href="/smmanageapps/clientes" className="mt-4 inline-flex rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white">
            Ir para Clientes SaaS
          </Link>
        </article>

        <article className="rounded-[var(--radius-md)] border border-[color:var(--brand-navy)]/10 bg-[color:var(--color-white)] p-5 shadow-[var(--shadow-soft)]">
          <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">3. Licenca e renovacao</h3>
          <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
            O modelo atual usa duracao padrao em dias e permite renovacao incremental (+X dias) sem recadastro manual.
          </p>
          <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
            Use <strong>Modelos de Licenca</strong> para padroes e <strong>Licencas</strong> para ajuste/renovacao por tenant.
          </p>
          <Link href="/smmanageapps/clientes/modelos-licenca" className="mt-4 inline-flex rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white">
            Ir para Modelos de Licenca
          </Link>
        </article>

        <article className="rounded-[var(--radius-md)] border border-[color:var(--brand-navy)]/10 bg-[color:var(--color-white)] p-5 shadow-[var(--shadow-soft)]">
          <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">4. Validacao final do onboarding</h3>
          <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
            Ao concluir, valide acesso no dominio/subdominio/slug do tenant e confirme isolamento de dados.
          </p>
          <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
            Se necessario, ajuste loja unica do tenant e usuarios no painel de cliente.
          </p>
          <Link href="/smmanageapps/clientes/tenants" className="mt-4 inline-flex rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white">
            Ir para Clientes (Tenants)
          </Link>
        </article>
      </section>
    </PageShell>
  );
}
