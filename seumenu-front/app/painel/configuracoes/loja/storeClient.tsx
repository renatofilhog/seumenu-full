"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiRequestError, apiRequest } from "../../../lib/api";
import { BrandLoading } from "../../../components/shared/BrandLoading";

type Store = {
  id: number;
  nome: string;
  cnpj?: string;
  resumo?: string;
  bannerUrl?: string;
  logoUrl?: string;
  horarioFuncionamento?: string;
  localizacao?: string;
  corFundo?: string;
  habilitaVerificacaoMesa?: boolean;
};

type StoreFormState = {
  id: number | null;
  nome: string;
  cnpj: string;
  resumo: string;
  bannerUrl: string;
  logoUrl: string;
  banner: File | null;
  logo: File | null;
  horarioFuncionamento: string;
  localizacao: string;
  corFundo: string;
  habilitaVerificacaoMesa: boolean;
};

const emptyForm: StoreFormState = {
  id: null,
  nome: "",
  cnpj: "",
  resumo: "",
  bannerUrl: "",
  logoUrl: "",
  banner: null,
  logo: null,
  horarioFuncionamento: "",
  localizacao: "",
  corFundo: "#ffffff",
  habilitaVerificacaoMesa: false,
};

function buildFormData(form: StoreFormState): FormData {
  const payload = new FormData();

  payload.append("nome", form.nome);
  payload.append("resumo", form.resumo);
  payload.append("horarioFuncionamento", form.horarioFuncionamento);
  payload.append("localizacao", form.localizacao);
  payload.append("corFundo", form.corFundo);
  payload.append("habilitaVerificacaoMesa", String(form.habilitaVerificacaoMesa));

  if (form.cnpj) payload.append("cnpj", form.cnpj);
  if (form.bannerUrl) payload.append("bannerUrl", form.bannerUrl);
  if (form.logoUrl) payload.append("logoUrl", form.logoUrl);
  if (form.banner) payload.append("banner", form.banner);
  if (form.logo) payload.append("logo", form.logo);

  return payload;
}

export function StoreClient() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<StoreFormState>(emptyForm);

  const isEditMode = useMemo(() => form.id !== null, [form.id]);

  async function loadStore() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<Store | null>("/store/me", { method: "GET" });
      if (!data) {
        setForm(emptyForm);
        return;
      }

      setForm({
        id: data.id,
        nome: data.nome ?? "",
        cnpj: data.cnpj ?? "",
        resumo: data.resumo ?? "",
        bannerUrl: data.bannerUrl ?? "",
        logoUrl: data.logoUrl ?? "",
        banner: null,
        logo: null,
        horarioFuncionamento: data.horarioFuncionamento ?? "",
        localizacao: data.localizacao ?? "",
        corFundo: data.corFundo ?? "#ffffff",
        habilitaVerificacaoMesa: Boolean(data.habilitaVerificacaoMesa),
      });
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) {
        setForm(emptyForm);
        return;
      }
      setError(err instanceof Error ? err.message : "Erro ao carregar loja do tenant");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStore();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const hasBannerBoth = form.bannerUrl.trim() && form.banner;
      const hasLogoBoth = form.logoUrl.trim() && form.logo;
      if (hasBannerBoth || hasLogoBoth) {
        const shouldContinue = window.confirm(
          "Voce preencheu URL e upload. Os arquivos enviados por upload vao prevalecer. Deseja continuar?",
        );
        if (!shouldContinue) {
          setSubmitting(false);
          return;
        }
      }

      const payload = buildFormData({
        ...form,
        bannerUrl: form.bannerUrl.trim(),
        logoUrl: form.logoUrl.trim(),
      });

      await apiRequest<Store>("/store/me", {
        method: "PUT",
        body: payload,
      });

      setSuccess("Dados da loja salvos com sucesso.");
      await loadStore();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar loja");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--brand-navy)]/60">
              Configuracoes
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--brand-ink)]">
              Loja do Tenant
            </h2>
            <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
              {isEditMode
                ? "Edite os dados da loja vinculada ao tenant atual."
                : "Nenhuma loja encontrada para este tenant. Preencha para criar a loja inicial."}
            </p>
          </div>
        </div>

        {loading ? (
          <BrandLoading size="sm" className="mt-6" />
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--brand-red)]/40 bg-[color:var(--brand-red)]/10 p-4 text-sm text-[color:var(--brand-ink)]">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--brand-green)]/40 bg-[color:var(--brand-green)]/10 p-4 text-sm text-[color:var(--brand-ink)]">
            {success}
          </div>
        ) : null}
      </section>

      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <form
          className="grid gap-4 rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] p-4 shadow-[var(--shadow-soft)] md:grid-cols-2"
          onSubmit={handleSubmit}
        >
          <label className="text-xs text-[color:var(--brand-navy)]/70">
            Nome
            <input
              className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
              type="text"
              value={form.nome}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, nome: event.target.value }))
              }
              required
            />
          </label>
          <label className="text-xs text-[color:var(--brand-navy)]/70">
            CNPJ
            <input
              className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
              type="text"
              value={form.cnpj}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, cnpj: event.target.value }))
              }
            />
          </label>
          <label className="text-xs text-[color:var(--brand-navy)]/70 md:col-span-2">
            Resumo
            <textarea
              className="mt-2 min-h-[90px] w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
              value={form.resumo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, resumo: event.target.value }))
              }
              required
            />
          </label>
          <label className="text-xs text-[color:var(--brand-navy)]/70">
            Horario de funcionamento
            <input
              className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
              type="text"
              value={form.horarioFuncionamento}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  horarioFuncionamento: event.target.value,
                }))
              }
              required
            />
          </label>
          <label className="text-xs text-[color:var(--brand-navy)]/70">
            Localizacao
            <input
              className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
              type="text"
              value={form.localizacao}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  localizacao: event.target.value,
                }))
              }
              required
            />
          </label>
          <label className="text-xs text-[color:var(--brand-navy)]/70">
            Cor de fundo (HEX)
            <div className="mt-2 flex items-center gap-3">
              <input
                className="h-10 w-12 rounded-lg border border-[color:var(--brand-navy)]/10 bg-white p-1"
                type="color"
                value={form.corFundo}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    corFundo: event.target.value,
                  }))
                }
                aria-label="Selecionar cor de fundo"
              />
              <input
                className="w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                type="text"
                value={form.corFundo}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    corFundo: event.target.value,
                  }))
                }
                placeholder="#ffffff"
                required
              />
            </div>
          </label>
          <label className="flex items-center gap-2 text-xs text-[color:var(--brand-navy)]/70 md:col-span-2">
            <input
              type="checkbox"
              checked={form.habilitaVerificacaoMesa}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  habilitaVerificacaoMesa: event.target.checked,
                }))
              }
            />
            Habilitar verificacao de mesa no fluxo do cliente
          </label>
          <label className="text-xs text-[color:var(--brand-navy)]/70">
            URL do banner
            <input
              className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
              type="url"
              value={form.bannerUrl}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, bannerUrl: event.target.value }))
              }
              placeholder="https://..."
            />
          </label>
          <label className="text-xs text-[color:var(--brand-navy)]/70">
            Upload do banner
            <input
              className="mt-2 block w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
              type="file"
              accept="image/*"
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  banner: event.target.files?.[0] ?? null,
                }))
              }
            />
          </label>
          <label className="text-xs text-[color:var(--brand-navy)]/70">
            URL da logo
            <input
              className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
              type="url"
              value={form.logoUrl}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, logoUrl: event.target.value }))
              }
              placeholder="https://..."
            />
          </label>
          <label className="text-xs text-[color:var(--brand-navy)]/70">
            Upload da logo
            <input
              className="mt-2 block w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
              type="file"
              accept="image/*"
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  logo: event.target.files?.[0] ?? null,
                }))
              }
            />
          </label>

          <button
            className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white md:col-span-2"
            type="submit"
            disabled={submitting || loading}
          >
            {submitting ? "Salvando..." : isEditMode ? "Salvar alteracoes" : "Criar loja"}
          </button>
        </form>
      </section>
    </div>
  );
}
