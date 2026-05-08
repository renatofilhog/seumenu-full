"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageShell } from "../../../components/dashboard/PageShell";
import { HelpLabel } from "../components/HelpLabel";
import { TableBase } from "../components/TableBase";
import { Tenant, fetchTenants, provisionTenant } from "../clientes-api";

const emptyForm = {
  tenantName: "",
  tenantSlug: "",
  domain: "",
  subdomain: "",
  externalRef: "",
};

export default function ProvisionamentoPage() {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  async function loadTenants() {
    setTenants(await fetchTenants());
  }

  useEffect(() => {
    loadTenants().catch((err) => setError(err instanceof Error ? err.message : "Erro"));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const result = await provisionTenant({
        ...form,
        domain: form.domain || undefined,
        subdomain: form.subdomain || undefined,
        licenseStatus: "active",
        externalRef: form.externalRef || undefined,
      });
      setMessage((result as { message?: string }).message || "Provisionamento concluído");
      setForm(emptyForm);
      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no provisionamento");
    }
  }

  return (
    <PageShell title="Provisionamento" scope="saas">
      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold text-[color:var(--brand-ink)]">Ativacao de Novos Clientes</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <HelpLabel label="Nome do cliente" help="Nome comercial do cliente a ser ativado.">
            <input className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2" value={form.tenantName} onChange={(e) => setForm((p) => ({ ...p, tenantName: e.target.value }))} required />
          </HelpLabel>
          <HelpLabel label="Identificador (slug)" help="Codigo unico do cliente para idempotencia e integracao.">
            <input className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2" value={form.tenantSlug} onChange={(e) => setForm((p) => ({ ...p, tenantSlug: e.target.value }))} required />
          </HelpLabel>
          <HelpLabel label="Dominio" help="Dominio principal opcional para resolver o cliente por host.">
            <input className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2" value={form.domain} onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))} />
          </HelpLabel>
          <HelpLabel label="Subdominio" help="Subdominio opcional para roteamento multi-tenant.">
            <input className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2" value={form.subdomain} onChange={(e) => setForm((p) => ({ ...p, subdomain: e.target.value }))} />
          </HelpLabel>
          <HelpLabel label="Referencia externa" help="Referencia opcional para integracao e rastreio em sistemas externos.">
            <input className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2" value={form.externalRef} onChange={(e) => setForm((p) => ({ ...p, externalRef: e.target.value }))} />
          </HelpLabel>
          <button className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white md:col-span-2" type="submit">
            Executar provisionamento
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}
      </section>

      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <h3 className="mb-4 text-lg font-semibold text-[color:var(--brand-ink)]">Tabela de consulta de clientes provisionados</h3>
        <TableBase headers={["ID", "Nome", "Identificador", "Dominio", "Subdominio", "Status"]}>
          {tenants.map((tenant) => (
            <tr key={tenant.id}>
              <td className="px-3 py-2">{tenant.id}</td>
              <td className="px-3 py-2">{tenant.nome}</td>
              <td className="px-3 py-2">{tenant.slug}</td>
              <td className="px-3 py-2">{tenant.dominio || "-"}</td>
              <td className="px-3 py-2">{tenant.subdominio || "-"}</td>
              <td className="px-3 py-2">{tenant.ativo ? "Ativo" : "Inativo"}</td>
            </tr>
          ))}
        </TableBase>
      </section>
    </PageShell>
  );
}
