"use client";

import { FormEvent, useState } from "react";
import { PageShell } from "../../components/dashboard/PageShell";
import { changeMyAppPassword } from "../acessos/acessos-api";

const emptyForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function MinhaSenhaPainelPage() {
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
      await changeMyAppPassword(form);
      setForm(emptyForm);
      setSuccess("Senha alterada com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar senha");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="Minha Senha">
      <section className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold text-[color:var(--brand-ink)]">Alterar minha senha</h2>
        <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
          Atualize sua senha de acesso ao painel sempre que necessario.
        </p>

        <form className="mt-4 grid gap-3 md:max-w-xl" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2 text-sm font-semibold text-[color:var(--brand-ink)]">
            Senha atual
            <input
              type="password"
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={form.currentPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[color:var(--brand-ink)]">
            Nova senha
            <input
              type="password"
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={form.newPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[color:var(--brand-ink)]">
            Confirmar nova senha
            <input
              type="password"
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={form.confirmPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              required
            />
          </label>

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
