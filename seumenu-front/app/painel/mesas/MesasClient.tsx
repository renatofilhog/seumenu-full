"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";
import { BrandLoading } from "../../components/shared/BrandLoading";

type Mesa = {
  id: number;
  numero: number;
  descricao: string;
  setor: string;
  ativo: boolean;
};

type TenantContext = {
  id: number;
  nome: string;
  slug: string;
};

type FormState = {
  id: number | null;
  numero: string;
  descricao: string;
  setor: string;
  ativo: boolean;
};

const emptyForm: FormState = {
  id: null,
  numero: "",
  descricao: "",
  setor: "",
  ativo: true,
};

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  return apiRequest<T>(path, options);
}

export function MesasClient() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tenant, setTenant] = useState<TenantContext | null>(null);
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    title: string;
    dataUrl: string;
    link: string;
  }>({ open: false, title: "", dataUrl: "", link: "" });

  const modeLabel = useMemo(() => (form.id ? "Atualizar" : "Criar"), [form.id]);
  const filteredMesas = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return mesas;

    return mesas.filter((mesa) => {
      const numero = String(mesa.numero).toLowerCase();
      const descricao = mesa.descricao.toLowerCase();
      const setor = mesa.setor.toLowerCase();

      return (
        numero.includes(query) ||
        descricao.includes(query) ||
        setor.includes(query)
      );
    });
  }, [mesas, searchTerm]);

  async function loadMesas() {
    setLoading(true);
    setError(null);
    try {
      const data = await requestJson<Mesa[]>("/mesa");
      setMesas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMesas();
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadTenant() {
      try {
        const resolvedTenant = await requestJson<TenantContext>("/tenant/resolve", {
          method: "GET",
        });
        if (mounted) {
          setTenant(resolvedTenant);
        }
      } catch (err) {
        if (mounted) {
          setTenant(null);
          setError(err instanceof Error ? err.message : "Erro ao resolver tenant");
        }
      }
    }

    void loadTenant();

    return () => {
      mounted = false;
    };
  }, []);

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleEdit(mesa: Mesa) {
    setForm({
      id: mesa.id,
      numero: String(mesa.numero),
      descricao: mesa.descricao,
      setor: mesa.setor,
      ativo: mesa.ativo,
    });
    setIsModalOpen(true);
  }

  function handleReset() {
    setForm(emptyForm);
    setIsModalOpen(false);
  }

  async function openQrModal(title: string, link: string) {
    if (!tenant?.slug) {
      setError("Slug do tenant nao resolvido para gerar QR Code.");
      return;
    }

    try {
      const dataUrl = await QRCode.toDataURL(link, {
        width: 320,
        margin: 1,
      });
      setQrModal({ open: true, title, dataUrl, link });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar QR Code");
    }
  }

  async function handleQrCode(mesa: Mesa) {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/loja/${tenant?.slug}?mesa=${mesa.id}`;
    await openQrModal(`QR Code da mesa ${mesa.numero}`, link);
  }

  async function handleStoreQrCode() {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/loja/${tenant?.slug}`;
    await openQrModal("QR Code geral da loja", link);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        numero: Number(form.numero),
        descricao: form.descricao,
        setor: form.setor,
        ativo: form.ativo,
      };

      if (form.id) {
        await requestJson<Mesa>(`/mesa/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await requestJson<Mesa>("/mesa", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      handleReset();
      await loadMesas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(mesa: Mesa) {
    setSubmitting(true);
    setError(null);

    try {
      await requestJson<Mesa>(`/mesa/${mesa.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          numero: mesa.numero,
          descricao: mesa.descricao,
          setor: mesa.setor,
          ativo: !mesa.ativo,
        }),
      });
      await loadMesas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
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
              Mesas
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--brand-ink)]">
              CRUD de mesas do salao
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded-full border border-[color:var(--brand-navy)]/15 bg-white px-4 py-2 text-xs font-semibold text-[color:var(--brand-navy)]"
              type="button"
              onClick={() => void handleStoreQrCode()}
            >
              QR-CODE
            </button>
            <button
              className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white"
              type="button"
              onClick={() => setIsModalOpen(true)}
            >
              Nova mesa
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--brand-red)]/40 bg-[color:var(--brand-red)]/10 p-4 text-sm text-[color:var(--brand-ink)]">
            {error}
          </div>
        ) : null}
      </section>

      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
            Lista de mesas
          </h3>
          <label className="text-xs text-[color:var(--brand-navy)]/70">
            Buscar
            <input
              className="mt-2 w-full min-w-[220px] rounded-full border border-[color:var(--brand-navy)]/10 bg-white px-4 py-2 text-sm text-[color:var(--brand-ink)] md:w-72"
              type="search"
              placeholder="Numero, descricao ou setor"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-4 space-y-3">
          {loading ? (
            <BrandLoading size="sm" className="py-2" />
          ) : null}
          {!loading && filteredMesas.length === 0 ? (
            <p className="text-xs text-[color:var(--brand-navy)]/60">
              Nenhuma mesa encontrada.
            </p>
          ) : null}
          {filteredMesas.map((mesa) => (
            <div
              key={mesa.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] shadow-[var(--shadow-soft)] px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold text-[color:var(--brand-ink)]">
                  Mesa {mesa.numero}
                </p>
                <p className="text-xs text-[color:var(--brand-navy)]/70">
                  {mesa.descricao} - Setor {mesa.setor}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className={`rounded-full px-3 py-1 text-xs ${
                    mesa.ativo
                      ? "bg-[color:var(--brand-green)]/20 text-[color:var(--brand-ink)]"
                      : "bg-[color:var(--brand-red)]/15 text-[color:var(--brand-ink)]"
                  }`}
                  type="button"
                  onClick={() => handleToggle(mesa)}
                  disabled={submitting}
                >
                  {mesa.ativo ? "Ativa" : "Inativa"}
                </button>
                <button
                  className="rounded-full bg-white px-3 py-1 text-xs text-[color:var(--brand-navy)]"
                  type="button"
                  onClick={() => handleEdit(mesa)}
                  disabled={submitting}
                >
                  Editar
                </button>
              <button
                className="rounded-full bg-[color:var(--brand-green)]/20 px-3 py-1 text-xs text-[color:var(--brand-ink)]"
                type="button"
                onClick={() => void handleQrCode(mesa)}
              >
                QR Code
              </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft-lg)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
                {form.id ? "Editar mesa" : "Nova mesa"}
              </h3>
              <button
                className="rounded-full border border-[color:var(--brand-navy)]/20 px-3 py-1 text-xs text-[color:var(--brand-navy)]"
                type="button"
                onClick={handleReset}
              >
                Fechar
              </button>
            </div>

            <form
              className="mt-6 grid gap-4 rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] shadow-[var(--shadow-soft)] p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
              onSubmit={handleSubmit}
            >
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Numero
                <input
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="number"
                  value={form.numero}
                  onChange={(event) => handleChange("numero", event.target.value)}
                  required
                />
              </label>
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Descricao
                <input
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="text"
                  value={form.descricao}
                  onChange={(event) => handleChange("descricao", event.target.value)}
                  required
                />
              </label>
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Setor
                <input
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="text"
                  value={form.setor}
                  onChange={(event) => handleChange("setor", event.target.value)}
                  required
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-[color:var(--brand-navy)]/70">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(event) => handleChange("ativo", event.target.checked)}
                />
                Ativa
              </label>
              <div className="flex flex-wrap gap-2 md:col-span-4">
                <button
                  className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Salvando..." : modeLabel}
                </button>
                <button
                  className="rounded-full border border-[color:var(--brand-navy)]/20 px-4 py-2 text-xs font-semibold text-[color:var(--brand-navy)]"
                  type="button"
                  onClick={handleReset}
                  disabled={submitting}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {qrModal.open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft-lg)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
                {qrModal.title}
              </h3>
              <button
                className="rounded-full border border-[color:var(--brand-navy)]/20 px-3 py-1 text-xs text-[color:var(--brand-navy)]"
                type="button"
                onClick={() =>
                  setQrModal({ open: false, title: "", dataUrl: "", link: "" })
                }
              >
                Fechar
              </button>
            </div>
            <div className="mt-4 flex flex-col items-center gap-4">
              <Image
                src={qrModal.dataUrl}
                alt="QR Code"
                width={224}
                height={224}
                className="h-56 w-56"
              />
              <p className="break-all text-xs text-[color:var(--brand-navy)]/70">
                {qrModal.link}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
