"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_TOKEN_COOKIE, AUTH_USER_STORAGE } from "../../lib/api";
import { changeMyAppPassword } from "../acessos/acessos-api";

const emptyForm = {
  newPassword: "",
  confirmPassword: "",
};

export default function PrimeiroAcessoPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (form.newPassword !== form.confirmPassword) {
      setError("Nova senha e confirmacao nao conferem.");
      return;
    }

    setSaving(true);
    try {
      await changeMyAppPassword({
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      const rawUser = localStorage.getItem(AUTH_USER_STORAGE);
      if (rawUser) {
        const currentUser = JSON.parse(rawUser) as Record<string, unknown>;
        localStorage.setItem(
          AUTH_USER_STORAGE,
          JSON.stringify({ ...currentUser, forcePasswordChange: false }),
        );
      }

      document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
      router.replace("/painel/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar senha");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--brand-sand)] px-6 py-10">
      <main className="mx-auto max-w-xl rounded-[var(--radius-md)] bg-white p-8 shadow-[var(--shadow-soft-lg)]">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--brand-navy)]/60">
          Primeiro acesso
        </p>
        <h1 className="mt-3 text-2xl font-extrabold text-[color:var(--brand-ink)]">
          Defina sua nova senha
        </h1>
        <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
          Esta senha foi gerada provisoriamente. Antes de usar o painel, voce precisa criar uma nova senha.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2 text-sm font-bold text-[color:var(--brand-ink)]">
            Nova senha
            <input
              type="password"
              value={form.newPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              required
              autoComplete="new-password"
              className="rounded-[var(--radius-md)] border border-[color:var(--color-gray-200)] bg-[color:var(--color-gray-50)] px-4 py-3 text-sm"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold text-[color:var(--brand-ink)]">
            Confirmar nova senha
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              required
              autoComplete="new-password"
              className="rounded-[var(--radius-md)] border border-[color:var(--color-gray-200)] bg-[color:var(--color-gray-50)] px-4 py-3 text-sm"
            />
          </label>

          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[color:var(--color-green-500)] px-6 py-3 text-sm font-extrabold text-white disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </main>
    </div>
  );
}
