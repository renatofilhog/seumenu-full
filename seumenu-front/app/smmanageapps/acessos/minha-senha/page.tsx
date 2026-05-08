"use client";

import { FormEvent, useState } from "react";
import { PageShell } from "../../../components/dashboard/PageShell";
import { HelpLabel } from "../../clientes/components/HelpLabel";
import { changeMySaasPassword } from "../acessos-api";

const emptyForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function MinhaSenhaPage() {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.newPassword !== form.confirmPassword) {
      setError("Nova senha e confirmacao nao conferem.");
      return;
    }

    setSaving(true);
    try {
      await changeMySaasPassword(form);
      setForm(emptyForm);
      setSuccess("Senha alterada com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar senha");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="Minha Senha" scope="saas">
      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold text-[color:var(--brand-ink)]">Trocar Senha do Usuario Atual</h2>
        <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
          Use este formulario para alterar sua senha de acesso ao SMManageApps.
        </p>

        <form className="mt-4 grid gap-3 md:max-w-xl" onSubmit={onSubmit}>
          <HelpLabel label="Senha atual" help="Digite sua senha atual para confirmar identidade.">
            <input
              type="password"
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={form.currentPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
              required
            />
          </HelpLabel>

          <HelpLabel label="Nova senha" help="Minimo recomendado: 6 caracteres.">
            <input
              type="password"
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={form.newPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              required
            />
          </HelpLabel>

          <HelpLabel label="Confirmar nova senha" help="Repita a nova senha exatamente igual.">
            <input
              type="password"
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={form.confirmPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              required
            />
          </HelpLabel>

          <button
            type="submit"
            className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Alterar senha"}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-green-700">{success}</p> : null}
      </section>
    </PageShell>
  );
}
