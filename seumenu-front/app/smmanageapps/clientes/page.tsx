import Link from "next/link";
import { PageShell } from "../../components/dashboard/PageShell";

const cards = [
  {
    title: "Clientes (Tenants)",
    description: "Cadastro, edição e ativação/inativação de clientes.",
    href: "/smmanageapps/clientes/tenants",
  },
  {
    title: "Modelos de Licença",
    description: "Cadastro e manutenção dos planos-modelo com duração em dias.",
    href: "/smmanageapps/clientes/modelos-licenca",
  },
  {
    title: "Usuários",
    description: "Convite, papel e bloqueio de usuários do tenant.",
    href: "/smmanageapps/clientes/usuarios",
  },
  {
    title: "Criar Tenant",
    description: "Wizard em etapas para criar tenant com menos erro operacional.",
    href: "/smmanageapps/clientes/criar-tenant-assistido",
  },
];

export default function ClientesPage() {
  return (
    <PageShell title="Clientes SaaS" scope="saas">
      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--brand-navy)]/60">SaaS</p>
        <h2 className="mt-2 text-2xl font-semibold text-[color:var(--brand-ink)]">Central de Clientes</h2>
        <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
          Selecione um menu para operar clientes, modelos de licenca e usuarios.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-[var(--radius-md)] border border-[color:var(--brand-navy)]/10 bg-[color:var(--color-white)] p-5 shadow-[var(--shadow-soft)] transition hover:border-[color:var(--brand-navy)]/25"
          >
            <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">{card.title}</h3>
            <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">{card.description}</p>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
