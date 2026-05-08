"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageShell } from "../../../components/dashboard/PageShell";
import { HelpLabel } from "../components/HelpLabel";
import { TableBase } from "../components/TableBase";
import {
  LicensePlanOption,
  createLicensePlanModel,
  fetchAllLicensePlans,
  updateLicensePlanModel,
} from "../clientes-api";

type PlanType = "subscription" | "trial" | "custom";

const formDefault = {
  code: "",
  nome: "",
  type: "subscription" as PlanType,
  defaultDurationDays: "30",
  ativo: true,
};

export default function ModelosLicencaPage() {
  const [plans, setPlans] = useState<LicensePlanOption[]>([]);
  const [form, setForm] = useState(formDefault);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadPlans() {
    const data = await fetchAllLicensePlans();
    setPlans(data);
  }

  useEffect(() => {
    loadPlans().catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar modelos"));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const days = Number(form.defaultDurationDays);
    if (!Number.isFinite(days) || days <= 0) {
      setError("Duracao em dias deve ser maior que zero.");
      return;
    }

    try {
      setSaving(true);
      await createLicensePlanModel({
        code: form.code.trim().toLowerCase(),
        nome: form.nome.trim(),
        type: form.type,
        defaultDurationDays: days,
        ativo: form.ativo,
      });
      setForm(formDefault);
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar modelo de licenca");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(plan: LicensePlanOption) {
    try {
      await updateLicensePlanModel(plan.id, { ativo: !plan.ativo });
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar modelo");
    }
  }

  async function quickUpdateDays(plan: LicensePlanOption, value: string) {
    const days = Number(value);
    if (!Number.isFinite(days) || days <= 0) {
      setError("Duracao em dias deve ser maior que zero.");
      return;
    }

    try {
      await updateLicensePlanModel(plan.id, { defaultDurationDays: days });
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar duracao");
    }
  }

  return (
    <PageShell title="Modelos de Licenca" scope="saas">
      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold text-[color:var(--brand-ink)]">Cadastro de Modelos de Licenca</h2>
        <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
          Gerencie planos padrao (mensal, trimestral, anual etc.) com duracao em dias e status ativo/inativo.
        </p>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <HelpLabel label="Codigo" help="Identificador unico do modelo (ex.: mensal).">
            <input
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              required
            />
          </HelpLabel>

          <HelpLabel label="Nome" help="Nome exibido no painel.">
            <input
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={form.nome}
              onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
              required
            />
          </HelpLabel>

          <HelpLabel label="Tipo" help="Classificacao tecnica do modelo.">
            <select
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as PlanType }))}
            >
              <option value="subscription">Assinatura</option>
              <option value="trial">Trial</option>
              <option value="custom">Customizado</option>
            </select>
          </HelpLabel>

          <HelpLabel label="Duracao padrao (dias)" help="Usada no provisionamento e criacao de licenca quando nao houver override.">
            <input
              type="number"
              min={1}
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={form.defaultDurationDays}
              onChange={(event) => setForm((prev) => ({ ...prev, defaultDurationDays: event.target.value }))}
              required
            />
          </HelpLabel>

          <HelpLabel label="Status" help="Modelos inativos nao aparecem como opcao para novos provisionamentos.">
            <select
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={form.ativo ? "active" : "inactive"}
              onChange={(event) => setForm((prev) => ({ ...prev, ativo: event.target.value === "active" }))}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </HelpLabel>

          <button
            className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white md:col-span-2"
            type="submit"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Criar modelo"}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <h3 className="mb-4 text-lg font-semibold text-[color:var(--brand-ink)]">Modelos cadastrados</h3>
        <TableBase headers={["ID", "Codigo", "Nome", "Tipo", "Duracao (dias)", "Status", "Acoes"]}>
          {plans.map((plan) => (
            <tr key={plan.id}>
              <td className="px-3 py-2">{plan.id}</td>
              <td className="px-3 py-2">{plan.code}</td>
              <td className="px-3 py-2">{plan.nome}</td>
              <td className="px-3 py-2">{plan.type ?? "subscription"}</td>
              <td className="px-3 py-2">{plan.defaultDurationDays}</td>
              <td className="px-3 py-2">{plan.ativo ? "Ativo" : "Inativo"}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[color:var(--brand-navy)]/25 px-3 py-1 text-xs"
                    onClick={() => void toggleAtivo(plan)}
                  >
                    {plan.ativo ? "Inativar" : "Ativar"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[color:var(--brand-green)]/35 px-3 py-1 text-xs"
                    onClick={() => {
                      const next = window.prompt("Nova duracao em dias:", String(plan.defaultDurationDays));
                      if (next) {
                        void quickUpdateDays(plan, next);
                      }
                    }}
                  >
                    Ajustar dias
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </TableBase>
      </section>
    </PageShell>
  );
}
