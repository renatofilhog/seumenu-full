"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, apiRequest } from "../../../lib/api";

type ProductGroup = {
  id: number;
  nome: string;
  ativo: boolean;
  ordem: number;
};

type Additional = {
  id: number;
  nome: string;
  quantidadeMax: number;
  preco: string;
  ativo: boolean;
};

type Product = {
  id: number;
  nome: string;
  descricao: string;
  preco: string;
  ativo: boolean;
  destaque?: boolean;
  imagemUrl?: string;
  ordem?: number;
  grupo?: ProductGroup;
  grupos?: ProductGroup[];
  additionals?: Additional[];
};

type ProductFormState = {
  id: number | null;
  nome: string;
  descricao: string;
  preco: string;
  ativo: boolean;
  destaque: boolean;
  ordem: string;
  grupoId: string;
  additionalIds: number[];
  imagem: File | null;
  imagemAtualUrl: string;
};

const emptyForm: ProductFormState = {
  id: null,
  nome: "",
  descricao: "",
  preco: "",
  ativo: true,
  destaque: false,
  ordem: "",
  grupoId: "",
  additionalIds: [],
  imagem: null,
  imagemAtualUrl: "",
};

function maskPriceInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  if (cents === 0) return "";
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")}`;
}

function withApiPrefix(url: string): string {
  if (!url) return url;
  return url.startsWith("/") ? `${API_BASE_URL}${url}` : url;
}

type ProductFormClientProps = {
  productId?: string;
};

export function ProductFormClient({ productId }: ProductFormClientProps) {
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [additionals, setAdditionals] = useState<Additional[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState<"group" | "additional" | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [groupCreateForm, setGroupCreateForm] = useState({
    nome: "",
    ordem: "",
    ativo: true,
  });
  const [additionalCreateForm, setAdditionalCreateForm] = useState({
    nome: "",
    quantidadeMax: "1",
    preco: "",
    ativo: true,
  });
  const router = useRouter();

  const isEdit = Boolean(productId);
  const title = isEdit ? "Editar produto" : "Novo produto";
  const fileName = form.imagem?.name ?? "";

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [groupData, additionalData, productData] = await Promise.all([
          apiRequest<ProductGroup[]>("/product-group", { method: "GET" }),
          apiRequest<Additional[]>("/additional", { method: "GET" }),
          apiRequest<Product[]>("/product", { method: "GET" }),
        ]);

        if (!active) return;
        setGroups(groupData);
        setAdditionals(additionalData);

        if (productId) {
          const product = productData.find(
            (item) => String(item.id) === String(productId),
          );
          if (!product) {
            setError("Produto nao encontrado.");
            return;
          }

          const grupoId =
            product.grupo?.id ?? product.grupos?.[0]?.id ?? null;

          setForm({
            id: product.id,
            nome: product.nome ?? "",
            descricao: product.descricao ?? "",
            preco: (product.preco ?? "").replace(".", ","),
            ativo: Boolean(product.ativo),
            destaque: Boolean(product.destaque),
            ordem: product.ordem ? String(product.ordem) : "",
            grupoId: grupoId ? String(grupoId) : "",
            additionalIds: product.additionals?.map((item) => item.id) ?? [],
            imagem: null,
            imagemAtualUrl: product.imagemUrl ?? "",
          });
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!form.imagem) {
      setFilePreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(form.imagem);
    setFilePreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [form.imagem]);

  const previewUrl = useMemo(() => {
    if (filePreviewUrl) return filePreviewUrl;
    if (form.imagemAtualUrl) return withApiPrefix(form.imagemAtualUrl);
    return "";
  }, [filePreviewUrl, form.imagemAtualUrl]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);
    setStatusType(null);

    try {
      if (!form.imagem && !form.imagemAtualUrl && !isEdit) {
        throw new Error("Envie uma imagem do produto.");
      }

      const payload = new FormData();
      payload.append("nome", form.nome);
      payload.append("descricao", form.descricao);
      payload.append("preco", form.preco.replace(",", "."));
      payload.append("ativo", String(form.ativo));
      payload.append("destaque", String(form.destaque));

      if (form.ordem) {
        payload.append("ordem", form.ordem);
      }
      if (form.grupoId) {
        payload.append("grupoIds[]", form.grupoId);
      }
      form.additionalIds.forEach((additionalId) => {
        payload.append("additionalIds[]", String(additionalId));
      });
      if (form.imagem) {
        payload.append("imagem", form.imagem);
      }

      if (form.id) {
        await apiRequest<Product>(`/product/${form.id}`, {
          method: "PATCH",
          body: payload,
        });
        router.push("/painel/cardapio/produtos?status=success&action=update");
        return;
      } else {
        await apiRequest<Product>("/product", {
          method: "POST",
          body: payload,
        });
        setForm(emptyForm);
        setStatusType("success");
        setStatusMessage("Produto criado com sucesso.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      if (isEdit) {
        router.push("/painel/cardapio/produtos?status=error&action=update");
        return;
      }
      setStatusType("error");
      setStatusMessage(message);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const payload = {
        nome: groupCreateForm.nome,
        ordem: Number(groupCreateForm.ordem || 0),
        ativo: groupCreateForm.ativo,
      };
      const created = await apiRequest<ProductGroup>("/product-group", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setGroups((prev) => [...prev, created].sort((a, b) => a.ordem - b.ordem));
      setForm((prev) => ({ ...prev, grupoId: String(created.id) }));
      setGroupCreateForm({ nome: "", ordem: "", ativo: true });
      setCreateModal(null);
      setStatusType("success");
      setStatusMessage("Grupo criado com sucesso.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar grupo";
      setError(message);
      setStatusType("error");
      setStatusMessage(message);
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateAdditional(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const payload = {
        nome: additionalCreateForm.nome,
        quantidadeMax: Number(additionalCreateForm.quantidadeMax || 1),
        preco: additionalCreateForm.preco.replace(",", "."),
        ativo: additionalCreateForm.ativo,
      };
      const created = await apiRequest<Additional>("/additional", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAdditionals((prev) => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      setForm((prev) => ({
        ...prev,
        additionalIds: prev.additionalIds.includes(created.id)
          ? prev.additionalIds
          : [...prev.additionalIds, created.id],
      }));
      setAdditionalCreateForm({
        nome: "",
        quantidadeMax: "1",
        preco: "",
        ativo: true,
      });
      setCreateModal(null);
      setStatusType("success");
      setStatusMessage("Adicional criado com sucesso.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar adicional";
      setError(message);
      setStatusType("error");
      setStatusMessage(message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--brand-navy)]/60">
              Cardapio
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--brand-ink)]">
              {title}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/painel/cardapio/produtos"
              className="rounded-full border border-[color:var(--brand-navy)]/20 px-4 py-2 text-xs font-semibold text-[color:var(--brand-navy)]"
            >
              Voltar
            </Link>
            <button
              className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white"
              type="submit"
              form="product-form"
              disabled={submitting}
            >
              {submitting ? "Salvando..." : isEdit ? "Atualizar" : "Criar"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--brand-red)]/40 bg-[color:var(--brand-red)]/10 p-4 text-sm text-[color:var(--brand-ink)]">
            {error}
          </div>
        ) : null}
        {statusMessage ? (
          <div
            className={`mt-6 rounded-2xl border p-4 text-sm ${
              statusType === "success"
                ? "border-[color:var(--color-status-success)]/40 bg-[color:var(--color-status-success)]/10 text-[color:var(--color-status-success)]"
                : "border-[color:var(--brand-red)]/40 bg-[color:var(--brand-red)]/10 text-[color:var(--brand-ink)]"
            }`}
          >
            {statusMessage}
          </div>
        ) : null}
      </section>

      <form
        id="product-form"
        className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]"
        onSubmit={handleSubmit}
      >
        <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs text-[color:var(--brand-navy)]/70 md:col-span-2">
              Nome
              <input
                className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                type="text"
                value={form.nome}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, nome: event.target.value }))
                }
                required
                disabled={loading}
              />
            </label>
            <label className="text-xs text-[color:var(--brand-navy)]/70">
              Preco
              <input
                className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                type="text"
                value={form.preco}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    preco: maskPriceInput(event.target.value),
                  }))
                }
                required
                disabled={loading}
              />
            </label>
            <label className="text-xs text-[color:var(--brand-navy)]/70">
              Ordem
              <input
                className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                type="number"
                value={form.ordem}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, ordem: event.target.value }))
                }
                disabled={loading}
              />
            </label>
            <label className="text-xs text-[color:var(--brand-navy)]/70 md:col-span-2">
              Descricao
              <textarea
                className="mt-2 min-h-[120px] w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                value={form.descricao}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, descricao: event.target.value }))
                }
                required
                disabled={loading}
              />
            </label>
            <div className="text-xs text-[color:var(--brand-navy)]/70 md:col-span-2">
              <div className="flex items-center justify-between">
                <span>Grupo</span>
                <button
                  type="button"
                  className="rounded-full border border-[color:var(--brand-navy)]/20 px-2 py-1 text-[10px] font-semibold"
                  onClick={() => setCreateModal("group")}
                  disabled={loading || submitting}
                >
                  + Novo grupo
                </button>
              </div>
              <select
                className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                value={form.grupoId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, grupoId: event.target.value }))
                }
                required
                disabled={loading}
              >
                <option value="">Selecione</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[color:var(--brand-navy)]/70">
                Adicionais
              </p>
              <button
                type="button"
                className="rounded-full border border-[color:var(--brand-navy)]/20 px-2 py-1 text-[10px] font-semibold"
                onClick={() => setCreateModal("additional")}
                disabled={loading || submitting}
              >
                + Novo adicional
              </button>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {additionals.map((additional) => (
                <label
                  key={additional.id}
                  className="flex items-center gap-2 rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-xs text-[color:var(--brand-ink)]"
                >
                  <input
                    type="checkbox"
                    checked={form.additionalIds.includes(additional.id)}
                    onChange={(event) => {
                      setForm((prev) => ({
                        ...prev,
                        additionalIds: event.target.checked
                          ? [...prev.additionalIds, additional.id]
                          : prev.additionalIds.filter((id) => id !== additional.id),
                      }));
                    }}
                    disabled={loading}
                  />
                  {additional.nome}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-[color:var(--brand-navy)]/70">
                Imagem do produto
              </p>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-[color:var(--brand-navy)]/30 bg-[color:var(--color-gray-50)] px-4 py-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[color:var(--brand-ink)]">
                    {fileName || "Nenhuma imagem selecionada"}
                  </p>
                  <p className="text-[10px] text-[color:var(--brand-navy)]/60">
                    PNG ou JPG. Maximo recomendado 2MB.
                  </p>
                </div>
                <label
                  htmlFor="product-image"
                  className="cursor-pointer rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white"
                >
                  Escolher
                </label>
                <input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      imagem: event.target.files?.[0] ?? null,
                    }))
                  }
                  disabled={loading}
                />
              </div>
            </div>

            {previewUrl ? (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="group relative w-full overflow-hidden rounded-2xl border border-[color:var(--brand-navy)]/10 bg-[color:var(--color-gray-50)]"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={previewUrl}
                    alt="Preview do produto"
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/40 via-transparent to-transparent p-3 text-xs font-semibold text-white">
                  Clique para ampliar
                </div>
              </button>
            ) : (
              <div className="rounded-2xl border border-dashed border-[color:var(--brand-navy)]/20 bg-[color:var(--color-gray-50)] px-4 py-6 text-center text-xs text-[color:var(--brand-navy)]/60">
                Sem imagem cadastrada.
              </div>
            )}

            <div className="grid gap-3">
              <label className="flex items-center justify-between rounded-xl border border-[color:var(--brand-navy)]/10 bg-[color:var(--color-gray-50)] px-4 py-3 text-xs text-[color:var(--brand-ink)]">
                <span>Ativo</span>
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, ativo: event.target.checked }))
                  }
                  disabled={loading}
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-[color:var(--brand-navy)]/10 bg-[color:var(--color-gray-50)] px-4 py-3 text-xs text-[color:var(--brand-ink)]">
                <span>Destaque</span>
                <input
                  type="checkbox"
                  checked={form.destaque}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      destaque: event.target.checked,
                    }))
                  }
                  disabled={loading}
                />
              </label>
            </div>
          </div>
        </section>
      </form>

      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <button
            type="button"
            className="absolute right-8 top-8 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[color:var(--brand-ink)]"
            onClick={() => setPreviewOpen(false)}
          >
            Fechar
          </button>
          <div className="relative h-[70vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-black">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Imagem ampliada"
                fill
                className="object-contain"
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {createModal === "group" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form
            onSubmit={handleCreateGroup}
            className="w-full max-w-md rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-soft-lg)]"
          >
            <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
              Novo grupo
            </h3>
            <div className="mt-4 grid gap-3">
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Nome
                <input
                  className="mt-1 w-full rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                  value={groupCreateForm.nome}
                  onChange={(event) =>
                    setGroupCreateForm((prev) => ({
                      ...prev,
                      nome: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Ordem
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                  value={groupCreateForm.ordem}
                  onChange={(event) =>
                    setGroupCreateForm((prev) => ({
                      ...prev,
                      ordem: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-[color:var(--brand-navy)]/10 px-3 py-2 text-xs text-[color:var(--brand-ink)]">
                <span>Ativo</span>
                <input
                  type="checkbox"
                  checked={groupCreateForm.ativo}
                  onChange={(event) =>
                    setGroupCreateForm((prev) => ({
                      ...prev,
                      ativo: event.target.checked,
                    }))
                  }
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[color:var(--brand-navy)]/20 px-4 py-2 text-xs"
                onClick={() => setCreateModal(null)}
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                disabled={creating}
              >
                {creating ? "Criando..." : "Criar grupo"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {createModal === "additional" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form
            onSubmit={handleCreateAdditional}
            className="w-full max-w-md rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-soft-lg)]"
          >
            <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
              Novo adicional
            </h3>
            <div className="mt-4 grid gap-3">
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Nome
                <input
                  className="mt-1 w-full rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                  value={additionalCreateForm.nome}
                  onChange={(event) =>
                    setAdditionalCreateForm((prev) => ({
                      ...prev,
                      nome: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Quantidade maxima
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                  value={additionalCreateForm.quantidadeMax}
                  onChange={(event) =>
                    setAdditionalCreateForm((prev) => ({
                      ...prev,
                      quantidadeMax: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Preco
                <input
                  className="mt-1 w-full rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                  value={additionalCreateForm.preco}
                  onChange={(event) =>
                    setAdditionalCreateForm((prev) => ({
                      ...prev,
                      preco: maskPriceInput(event.target.value),
                    }))
                  }
                  required
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-[color:var(--brand-navy)]/10 px-3 py-2 text-xs text-[color:var(--brand-ink)]">
                <span>Ativo</span>
                <input
                  type="checkbox"
                  checked={additionalCreateForm.ativo}
                  onChange={(event) =>
                    setAdditionalCreateForm((prev) => ({
                      ...prev,
                      ativo: event.target.checked,
                    }))
                  }
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[color:var(--brand-navy)]/20 px-4 py-2 text-xs"
                onClick={() => setCreateModal(null)}
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                disabled={creating}
              >
                {creating ? "Criando..." : "Criar adicional"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
