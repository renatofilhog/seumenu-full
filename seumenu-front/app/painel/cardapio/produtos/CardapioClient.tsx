"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { BrandLoading } from "../../../components/shared/BrandLoading";

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
  products?: { id: number }[];
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

type GroupFormState = {
  id: number | null;
  nome: string;
  ativo: boolean;
  ordem: string;
};

type AdditionalFormState = {
  id: number | null;
  nome: string;
  quantidadeMax: string;
  preco: string;
  ativo: boolean;
  productIds: number[];
};

type ModalState =
  | { type: "group"; open: boolean }
  | { type: "additional"; open: boolean };

const emptyGroupForm: GroupFormState = {
  id: null,
  nome: "",
  ativo: true,
  ordem: "",
};

const emptyAdditionalForm: AdditionalFormState = {
  id: null,
  nome: "",
  quantidadeMax: "",
  preco: "",
  ativo: true,
  productIds: [],
};

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  return apiRequest<T>(path, options);
}

function maskPriceInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  if (cents === 0) return "";
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")}`;
}

export function CardapioClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [additionals, setAdditionals] = useState<Additional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: "group", open: false });
  const [groupForm, setGroupForm] = useState<GroupFormState>(emptyGroupForm);
  const [additionalForm, setAdditionalForm] = useState<AdditionalFormState>(
    emptyAdditionalForm
  );
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [additionalSearch, setAdditionalSearch] = useState("");
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const action = searchParams.get("action");
  const statusMessage =
    action === "update" && status === "success"
      ? "Produto atualizado com sucesso."
      : action === "update" && status === "error"
        ? "Nao foi possivel atualizar o produto."
        : null;

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [productData, groupData, additionalData] = await Promise.all([
        requestJson<Product[]>("/product"),
        requestJson<ProductGroup[]>("/product-group"),
        requestJson<Additional[]>("/additional"),
      ]);
      setProducts(productData);
      setGroups(groupData);
      setAdditionals(additionalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => {
      const nome = product.nome.toLowerCase();
      const descricao = product.descricao.toLowerCase();
      const preco = product.preco.toLowerCase();
      const grupo =
        product.grupo?.nome?.toLowerCase() ||
        product.grupos?.[0]?.nome?.toLowerCase() ||
        "";
      return (
        nome.includes(query) ||
        descricao.includes(query) ||
        preco.includes(query) ||
        grupo.includes(query)
      );
    });
  }, [products, productSearch]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const ordemA = a.ordem ?? 999;
      const ordemB = b.ordem ?? 999;
      if (ordemA !== ordemB) return ordemA - ordemB;
      return a.nome.localeCompare(b.nome);
    });
  }, [filteredProducts]);

  const filteredGroups = useMemo(() => {
    const query = groupSearch.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((group) => {
      const nome = group.nome.toLowerCase();
      const ordem = String(group.ordem).toLowerCase();
      return nome.includes(query) || ordem.includes(query);
    });
  }, [groups, groupSearch]);

  const filteredAdditionals = useMemo(() => {
    const query = additionalSearch.trim().toLowerCase();
    if (!query) return additionals;
    return additionals.filter((additional) => {
      const nome = additional.nome.toLowerCase();
      const preco = additional.preco.toLowerCase();
      const quantidade = String(additional.quantidadeMax).toLowerCase();
      return (
        nome.includes(query) ||
        preco.includes(query) ||
        quantidade.includes(query)
      );
    });
  }, [additionals, additionalSearch]);

  function openGroupModal(group?: ProductGroup) {
    if (group) {
      setGroupForm({
        id: group.id,
        nome: group.nome,
        ativo: group.ativo,
        ordem: String(group.ordem),
      });
    } else {
      setGroupForm(emptyGroupForm);
    }
    setModal({ type: "group", open: true });
  }

  function openAdditionalModal(additional?: Additional) {
    if (additional) {
      setAdditionalForm({
        id: additional.id,
        nome: additional.nome,
        quantidadeMax: String(additional.quantidadeMax),
        preco: additional.preco.replace(".", ","),
        ativo: additional.ativo,
        productIds: additional.products?.map((item) => item.id) || [],
      });
    } else {
      setAdditionalForm(emptyAdditionalForm);
    }
    setModal({ type: "additional", open: true });
  }

  function closeModal() {
    setModal((prev) => ({ ...prev, open: false }));
  }

  async function handleGroupSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        nome: groupForm.nome,
        ativo: groupForm.ativo,
        ordem: Number(groupForm.ordem),
      };

      if (groupForm.id) {
        await requestJson<ProductGroup>(`/product-group/${groupForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await requestJson<ProductGroup>("/product-group", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      closeModal();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdditionalSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        nome: additionalForm.nome,
        quantidadeMax: Number(additionalForm.quantidadeMax),
        preco: additionalForm.preco.replace(",", "."),
        ativo: additionalForm.ativo,
        productIds: additionalForm.productIds,
      };

      if (additionalForm.id) {
        await requestJson<Additional>(`/additional/${additionalForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await requestJson<Additional>("/additional", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      closeModal();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleProduct(product: Product) {
    setSubmitting(true);
    setError(null);
    try {
      await requestJson<Product>(`/product/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nome: product.nome,
          descricao: product.descricao,
          preco: product.preco,
          ativo: !product.ativo,
          destaque: product.destaque ?? false,
          ordem: product.ordem,
          grupoId: product.grupo?.id ?? product.grupos?.[0]?.id,
          additionalIds: product.additionals?.map((item) => item.id) || [],
        }),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleGroup(group: ProductGroup) {
    setSubmitting(true);
    setError(null);
    try {
      await requestJson<ProductGroup>(`/product-group/${group.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nome: group.nome,
          ativo: !group.ativo,
          ordem: group.ordem,
        }),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleAdditional(additional: Additional) {
    setSubmitting(true);
    setError(null);
    try {
      await requestJson<Additional>(`/additional/${additional.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nome: additional.nome,
          quantidadeMax: additional.quantidadeMax,
          preco: additional.preco,
          ativo: !additional.ativo,
          productIds: additional.products?.map((item) => item.id) || [],
        }),
      });
      await loadAll();
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
              Cardapio
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--brand-ink)]">
              Produtos, grupos e adicionais
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/painel/cardapio/produtos/novo"
              className="rounded-full bg-[color:var(--brand-green)] px-4 py-2 text-xs font-semibold text-[color:var(--brand-ink)]"
            >
              Novo produto
            </Link>
            <button
              className="rounded-full border border-[color:var(--brand-navy)]/20 px-4 py-2 text-xs font-semibold text-[color:var(--brand-navy)]"
              type="button"
              onClick={() => openGroupModal()}
            >
              Novo grupo
            </button>
            <button
              className="rounded-full border border-[color:var(--brand-navy)]/20 px-4 py-2 text-xs font-semibold text-[color:var(--brand-navy)]"
              type="button"
              onClick={() => openAdditionalModal()}
            >
              Novo adicional
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
              status === "success"
                ? "border-[color:var(--color-status-success)]/40 bg-[color:var(--color-status-success)]/10 text-[color:var(--color-status-success)]"
                : "border-[color:var(--brand-red)]/40 bg-[color:var(--brand-red)]/10 text-[color:var(--brand-ink)]"
            }`}
          >
            {statusMessage}
          </div>
        ) : null}
      </section>

      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
            Produtos
          </h3>
          <label className="text-xs text-[color:var(--brand-navy)]/70">
            Buscar
            <input
              className="mt-2 w-full min-w-[220px] rounded-full border border-[color:var(--brand-navy)]/10 bg-white px-4 py-2 text-sm text-[color:var(--brand-ink)] md:w-72"
              type="search"
              placeholder="Nome, descricao, preco ou grupo"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-4 space-y-3">
          {loading ? (
            <BrandLoading size="sm" className="py-2" />
          ) : null}
          {!loading && filteredProducts.length === 0 ? (
            <p className="text-xs text-[color:var(--brand-navy)]/60">
              Nenhum produto encontrado.
            </p>
          ) : null}
          {sortedProducts.map((product) => (
            <div
              key={product.id}
              className="grid gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] shadow-[var(--shadow-soft)] p-4 text-sm md:grid-cols-[1.1fr_0.7fr_0.4fr_0.4fr_auto]"
            >
              <div>
                <p className="font-semibold text-[color:var(--brand-ink)]">
                  {product.nome}
                </p>
                <p className="text-xs text-[color:var(--brand-navy)]/70">
                  {product.descricao}
                </p>
                {product.destaque ? (
                  <span className="mt-2 inline-flex rounded-full bg-[color:var(--brand-yellow)]/30 px-3 py-1 text-[10px] font-semibold text-[color:var(--brand-ink)]">
                    Destaque
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-[color:var(--brand-navy)]/70">
                Grupo: {product.grupo?.nome || product.grupos?.[0]?.nome || "-"}
              </div>
              <div className="text-xs text-[color:var(--brand-navy)]/70">
                Ordem: {product.ordem ?? "-"}
              </div>
              <div className="text-sm font-semibold text-[color:var(--brand-ink)]">
                {product.preco.replace(".", ",")}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className={`rounded-full px-3 py-1 text-xs ${
                    product.ativo
                      ? "bg-[color:var(--brand-green)]/20 text-[color:var(--brand-ink)]"
                      : "bg-[color:var(--brand-red)]/15 text-[color:var(--brand-ink)]"
                  }`}
                  type="button"
                  onClick={() => handleToggleProduct(product)}
                  disabled={submitting}
                >
                  {product.ativo ? "Ativo" : "Inativo"}
                </button>
                <Link
                  className="rounded-full bg-white px-3 py-1 text-xs text-[color:var(--brand-navy)]"
                  href={`/painel/cardapio/produtos/${product.id}`}
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
              Grupos
            </h3>
            <label className="text-xs text-[color:var(--brand-navy)]/70">
              Buscar
              <input
                className="mt-2 w-full min-w-[200px] rounded-full border border-[color:var(--brand-navy)]/10 bg-white px-4 py-2 text-sm text-[color:var(--brand-ink)]"
                type="search"
                placeholder="Nome ou ordem"
                value={groupSearch}
                onChange={(event) => setGroupSearch(event.target.value)}
              />
            </label>
          </div>
          <div className="mt-4 space-y-3">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] shadow-[var(--shadow-soft)] px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-[color:var(--brand-ink)]">
                    {group.nome}
                  </p>
                  <p className="text-xs text-[color:var(--brand-navy)]/70">
                    Ordem {group.ordem}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className={`rounded-full px-3 py-1 text-xs ${
                      group.ativo
                        ? "bg-[color:var(--brand-green)]/20 text-[color:var(--brand-ink)]"
                        : "bg-[color:var(--brand-red)]/15 text-[color:var(--brand-ink)]"
                    }`}
                    type="button"
                    onClick={() => handleToggleGroup(group)}
                    disabled={submitting}
                  >
                    {group.ativo ? "Ativo" : "Inativo"}
                  </button>
                  <button
                    className="rounded-full bg-white px-3 py-1 text-xs text-[color:var(--brand-navy)]"
                    type="button"
                    onClick={() => openGroupModal(group)}
                    disabled={submitting}
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
            {filteredGroups.length === 0 ? (
              <p className="text-xs text-[color:var(--brand-navy)]/60">
                Nenhum grupo encontrado.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
              Adicionais
            </h3>
            <label className="text-xs text-[color:var(--brand-navy)]/70">
              Buscar
              <input
                className="mt-2 w-full min-w-[200px] rounded-full border border-[color:var(--brand-navy)]/10 bg-white px-4 py-2 text-sm text-[color:var(--brand-ink)]"
                type="search"
                placeholder="Nome, preco ou quantidade"
                value={additionalSearch}
                onChange={(event) => setAdditionalSearch(event.target.value)}
              />
            </label>
          </div>
          <div className="mt-4 space-y-3">
            {filteredAdditionals.map((additional) => (
              <div
                key={additional.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] shadow-[var(--shadow-soft)] px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-[color:var(--brand-ink)]">
                    {additional.nome}
                  </p>
                  <p className="text-xs text-[color:var(--brand-navy)]/70">
                    Max {additional.quantidadeMax} - {additional.preco.replace(".", ",")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className={`rounded-full px-3 py-1 text-xs ${
                      additional.ativo
                        ? "bg-[color:var(--brand-green)]/20 text-[color:var(--brand-ink)]"
                        : "bg-[color:var(--brand-red)]/15 text-[color:var(--brand-ink)]"
                    }`}
                    type="button"
                    onClick={() => handleToggleAdditional(additional)}
                    disabled={submitting}
                  >
                    {additional.ativo ? "Ativo" : "Inativo"}
                  </button>
                  <button
                    className="rounded-full bg-white px-3 py-1 text-xs text-[color:var(--brand-navy)]"
                    type="button"
                    onClick={() => openAdditionalModal(additional)}
                    disabled={submitting}
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
            {filteredAdditionals.length === 0 ? (
              <p className="text-xs text-[color:var(--brand-navy)]/60">
                Nenhum adicional encontrado.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {modal.open && modal.type === "group" ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft-lg)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
                {groupForm.id ? "Editar grupo" : "Novo grupo"}
              </h3>
              <button
                className="rounded-full border border-[color:var(--brand-navy)]/20 px-3 py-1 text-xs text-[color:var(--brand-navy)]"
                type="button"
                onClick={closeModal}
              >
                Fechar
              </button>
            </div>
            <form
              className="mt-6 grid gap-4 rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] shadow-[var(--shadow-soft)] p-4"
              onSubmit={handleGroupSubmit}
            >
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Nome
                <input
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="text"
                  value={groupForm.nome}
                  onChange={(event) =>
                    setGroupForm((prev) => ({
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
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="number"
                  value={groupForm.ordem}
                  onChange={(event) =>
                    setGroupForm((prev) => ({
                      ...prev,
                      ordem: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-[color:var(--brand-navy)]/70">
                <input
                  type="checkbox"
                  checked={groupForm.ativo}
                  onChange={(event) =>
                    setGroupForm((prev) => ({
                      ...prev,
                      ativo: event.target.checked,
                    }))
                  }
                />
                Ativo
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "Salvando..."
                    : groupForm.id
                    ? "Atualizar"
                    : "Criar"}
                </button>
                <button
                  className="rounded-full border border-[color:var(--brand-navy)]/20 px-4 py-2 text-xs font-semibold text-[color:var(--brand-navy)]"
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {modal.open && modal.type === "additional" ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft-lg)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
                {additionalForm.id ? "Editar adicional" : "Novo adicional"}
              </h3>
              <button
                className="rounded-full border border-[color:var(--brand-navy)]/20 px-3 py-1 text-xs text-[color:var(--brand-navy)]"
                type="button"
                onClick={closeModal}
              >
                Fechar
              </button>
            </div>
            <form
              className="mt-6 grid gap-4 rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] shadow-[var(--shadow-soft)] p-4"
              onSubmit={handleAdditionalSubmit}
            >
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Nome
                <input
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="text"
                  value={additionalForm.nome}
                  onChange={(event) =>
                    setAdditionalForm((prev) => ({
                      ...prev,
                      nome: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Quantidade max
                <input
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="number"
                  value={additionalForm.quantidadeMax}
                  onChange={(event) =>
                    setAdditionalForm((prev) => ({
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
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="text"
                  value={additionalForm.preco}
                  onChange={(event) =>
                    setAdditionalForm((prev) => ({
                      ...prev,
                      preco: maskPriceInput(event.target.value),
                    }))
                  }
                  required
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-[color:var(--brand-navy)]/70">
                <input
                  type="checkbox"
                  checked={additionalForm.ativo}
                  onChange={(event) =>
                    setAdditionalForm((prev) => ({
                      ...prev,
                      ativo: event.target.checked,
                    }))
                  }
                />
                Ativo
              </label>
              <div className="text-xs text-[color:var(--brand-navy)]/70">
                Produtos
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {products.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-2 rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-xs text-[color:var(--brand-ink)]"
                    >
                      <input
                        type="checkbox"
                        checked={additionalForm.productIds.includes(product.id)}
                        onChange={(event) => {
                          setAdditionalForm((prev) => ({
                            ...prev,
                            productIds: event.target.checked
                              ? [...prev.productIds, product.id]
                              : prev.productIds.filter(
                                  (id) => id !== product.id
                                ),
                          }));
                        }}
                      />
                      {product.nome}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "Salvando..."
                    : additionalForm.id
                    ? "Atualizar"
                    : "Criar"}
                </button>
                <button
                  className="rounded-full border border-[color:var(--brand-navy)]/20 px-4 py-2 text-xs font-semibold text-[color:var(--brand-navy)]"
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
