"use client";

import { useEffect, useMemo, useState } from "react";
import { PageShell } from "../../../components/dashboard/PageShell";
import { TableBase } from "../components/TableBase";
import {
  type LicensePlanOption,
  type Tenant,
  fetchActiveLicensePlans,
  fetchTenants,
  renewTenantLicenseByModel,
  updateTenant,
} from "../clientes-api";

const emptyEditForm = { nome: "", slug: "", dominio: "", subdominio: "" };

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("pt-BR");
}

function formatDays(value?: number | null) {
  if (value == null) return "—";
  return String(Math.max(0, value));
}

function buildRenewPreview(validUntil: string | null | undefined, durationDays: number) {
  const now = new Date();
  const current = validUntil ? new Date(validUntil) : null;
  const baseDate = current && current >= now ? current : now;
  const next = new Date(baseDate);
  next.setDate(next.getDate() + durationDays);
  return next.toLocaleDateString("pt-BR");
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<LicensePlanOption[]>([]);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [renewTenant, setRenewTenant] = useState<Tenant | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  async function load() {
    try {
      setTenants(await fetchTenants());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar tenants");
    }
  }

  useEffect(() => {
    void load();
    fetchActiveLicensePlans()
      .then((data) => {
        setPlans(data);
        if (data.length > 0) {
          setSelectedPlanId(data[0].id);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar modelos de licenca");
      });
  }, []);

  async function saveEdit() {
    if (!editTenant) return;
    setError(null);
    setEditing(true);
    try {
      await updateTenant(editTenant.id, {
        nome: editForm.nome.trim(),
        slug: editForm.slug.trim(),
        dominio: editForm.dominio.trim() || undefined,
        subdominio: editForm.subdominio.trim() || undefined,
      });
      setEditTenant(null);
      setEditForm(emptyEditForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar tenant");
    } finally {
      setEditing(false);
    }
  }

  async function deactivate(tenant: Tenant) {
    if (!tenant.ativo) return;
    setError(null);
    try {
      await updateTenant(tenant.id, { ativo: false });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar tenant");
    }
  }

  async function confirmRenew() {
    if (!renewTenant || !selectedPlanId) return;
    setRenewing(true);
    setError(null);
    try {
      await renewTenantLicenseByModel(renewTenant.id, selectedPlanId);
      setRenewTenant(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao renovar licenca");
    } finally {
      setRenewing(false);
    }
  }
  function openEditModal(tenant: Tenant) {
    setEditTenant(tenant);
    setEditForm({
      nome: tenant.nome,
      slug: tenant.slug,
      dominio: tenant.dominio ?? "",
      subdominio: tenant.subdominio ?? "",
    });
  }

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );
  const renewPreview = useMemo(() => {
    if (!renewTenant || !selectedPlan) return "—";
    return buildRenewPreview(renewTenant.validUntil, selectedPlan.defaultDurationDays);
  }, [renewTenant, selectedPlan]);

  return (
    <PageShell title="Clientes (Tenants)" scope="saas">
      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold text-[color:var(--brand-ink)]">Gestao de Clientes (Tenants)</h2>
        <p className="mt-3 text-sm text-[color:var(--brand-navy)]/70">
          Criacao de tenant desabilitada nesta tela. Para novos clientes, use o menu <strong>Criar Tenant</strong>.
        </p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <h3 className="mb-4 text-lg font-semibold text-[color:var(--brand-ink)]">Tabela de consulta de clientes</h3>
        <TableBase headers={["ID", "Nome", "Identificador", "Dominio", "Subdominio", "Modelo Licenca", "Validade", "Dias restantes", "Status", "Acao"]}>
          {tenants.map((tenant) => (
            <tr key={tenant.id}>
              <td className="px-3 py-2">{tenant.id}</td>
              <td className="px-3 py-2">{tenant.nome}</td>
              <td className="px-3 py-2">{tenant.slug}</td>
              <td className="px-3 py-2">{tenant.dominio || "-"}</td>
              <td className="px-3 py-2">{tenant.subdominio || "-"}</td>
              <td className="px-3 py-2">{tenant.licenseModelName ?? "Sem licenca"}</td>
              <td className="px-3 py-2">{formatDate(tenant.validUntil)}</td>
              <td className="px-3 py-2">{formatDays(tenant.daysRemaining)}</td>
              <td className="px-3 py-2">{tenant.ativo ? "Ativo" : "Inativo"}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[color:var(--brand-navy)]/25 px-3 py-1 text-xs"
                    onClick={() => openEditModal(tenant)}
                  >
                    Editar
                  </button>
                  {tenant.ativo ? (
                    <button
                      type="button"
                      className="rounded-full border border-[color:var(--brand-navy)]/25 px-3 py-1 text-xs"
                      onClick={() => void deactivate(tenant)}
                    >
                      Inativar
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-full border border-[color:var(--brand-green)]/30 px-3 py-1 text-xs"
                    onClick={() => {
                      setRenewTenant(tenant);
                      setSelectedPlanId(tenant.licenseModelId ?? plans[0]?.id ?? null);
                    }}
                  >
                    {tenant.licenseModelName ? "Renovar" : "Ativar/Renovar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </TableBase>
      </section>

      {renewTenant ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <section className="w-full max-w-lg rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-soft-lg)]">
            <h4 className="text-lg font-semibold text-[color:var(--brand-ink)]">
              Renovar licenca - {renewTenant.nome}
            </h4>
            <p className="mt-1 text-sm text-[color:var(--brand-navy)]/70">
              Selecione o modelo e confirme a renovacao.
            </p>

            <label className="mt-4 flex flex-col gap-2 text-sm text-[color:var(--brand-ink)]">
              Modelo de licenca
              <select
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={selectedPlanId ?? ""}
                onChange={(event) => setSelectedPlanId(Number(event.target.value))}
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nome} ({plan.defaultDurationDays} dias)
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 rounded-xl border border-[color:var(--brand-navy)]/10 bg-[color:var(--brand-navy)]/5 p-3 text-sm text-[color:var(--brand-ink)]">
              <p>Validade atual: {formatDate(renewTenant.validUntil)}</p>
              <p>Nova validade prevista: {renewPreview}</p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[color:var(--brand-navy)]/20 px-4 py-2 text-sm"
                onClick={() => setRenewTenant(null)}
                disabled={renewing}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => void confirmRenew()}
                disabled={renewing || !selectedPlanId}
              >
                {renewing ? "Renovando..." : "Confirmar renovacao"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {editTenant ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <section className="w-full max-w-lg rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-soft-lg)]">
            <h4 className="text-lg font-semibold text-[color:var(--brand-ink)]">Editar tenant - {editTenant.nome}</h4>
            <p className="mt-1 text-sm text-[color:var(--brand-navy)]/70">
              Atualize os dados do cliente existente.
            </p>

            <div className="mt-4 grid gap-3">
              <label className="flex flex-col gap-1 text-sm text-[color:var(--brand-ink)]">
                Nome
                <input
                  className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                  value={editForm.nome}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, nome: event.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[color:var(--brand-ink)]">
                Identificador (slug)
                <input
                  className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                  value={editForm.slug}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, slug: event.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[color:var(--brand-ink)]">
                Dominio
                <input
                  className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                  value={editForm.dominio}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, dominio: event.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[color:var(--brand-ink)]">
                Subdominio
                <input
                  className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                  value={editForm.subdominio}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, subdominio: event.target.value }))}
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[color:var(--brand-navy)]/20 px-4 py-2 text-sm"
                onClick={() => {
                  setEditTenant(null);
                  setEditForm(emptyEditForm);
                }}
                disabled={editing}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => void saveEdit()}
                disabled={editing || !editForm.nome.trim() || !editForm.slug.trim()}
              >
                {editing ? "Salvando..." : "Salvar alteracoes"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
