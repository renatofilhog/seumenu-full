"use client";

import { useEffect, useMemo, useState } from "react";
import { PageShell } from "../../../components/dashboard/PageShell";
import { HelpLabel } from "../components/HelpLabel";
import { TableBase } from "../components/TableBase";
import {
  fetchAllTenantUsers,
  fetchTenants,
  resetTenantUserPassword,
  updateTenantUser,
} from "../clientes-api";
import type { Tenant, TenantUserRow } from "../clientes-api";

type EditForm = {
  nome: string;
  email: string;
  roleId: string;
  ativo: boolean;
};

const emptyEditForm: EditForm = { nome: "", email: "", roleId: "", ativo: true };

type TempPasswordResult = {
  userName: string;
  userEmail: string;
  tempPassword: string;
};

export default function UsuariosTenantPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<TenantUserRow[]>([]);
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [groupByTenant, setGroupByTenant] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [editingRow, setEditingRow] = useState<TenantUserRow | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm);
  const [tempPasswordResult, setTempPasswordResult] = useState<TempPasswordResult | null>(null);

  async function loadTenants() {
    const data = await fetchTenants();
    setTenants(data);
  }

  async function loadUsers(filter: string) {
    const tenantId = filter === "all" ? undefined : Number(filter);
    const data = await fetchAllTenantUsers(tenantId);
    setUsers(data);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTenants(), loadUsers("all")])
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar usuários"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    loadUsers(tenantFilter)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar usuários"))
      .finally(() => setLoading(false));
  }, [tenantFilter]);

  function resolveTenantLabel(row: TenantUserRow) {
    if (row.tenant) {
      return `${row.tenant.nome} (${row.tenant.slug})`;
    }
    const tenant = tenants.find((item) => item.id === row.tenantId);
    if (!tenant) return `Tenant #${row.tenantId}`;
    return `${tenant.nome} (${tenant.slug})`;
  }

  function openEditModal(row: TenantUserRow) {
    setEditingRow(row);
    setEditForm({
      nome: row.user.nome,
      email: row.user.email,
      roleId: row.role?.id ? String(row.role.id) : "",
      ativo: row.ativo,
    });
  }

  async function submitEdit() {
    if (!editingRow) return;
    setSavingEdit(true);
    setError(null);
    try {
      await updateTenantUser(editingRow.id, {
        nome: editForm.nome.trim(),
        email: editForm.email.trim().toLowerCase(),
        roleId: editForm.roleId ? Number(editForm.roleId) : undefined,
        ativo: editForm.ativo,
      });
      setEditingRow(null);
      setEditForm(emptyEditForm);
      await loadUsers(tenantFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar usuário");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleResetPassword(row: TenantUserRow) {
    const confirmed = window.confirm(`Gerar nova senha temporária para ${row.user.nome}?`);
    if (!confirmed) return;
    setResetting(true);
    setError(null);
    try {
      const response = await resetTenantUserPassword(row.id);
      setTempPasswordResult({
        userName: row.user.nome,
        userEmail: row.user.email,
        tempPassword: response.tempPassword,
      });
      await loadUsers(tenantFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao resetar senha");
    } finally {
      setResetting(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const normalizedName = nameFilter.trim().toLowerCase();
    const normalizedEmail = emailFilter.trim().toLowerCase();

    return users.filter((row) => {
      const matchesName = normalizedName ? row.user.nome.toLowerCase().includes(normalizedName) : true;
      const matchesEmail = normalizedEmail ? row.user.email.toLowerCase().includes(normalizedEmail) : true;
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? row.ativo
            : !row.ativo;
      return matchesName && matchesEmail && matchesStatus;
    });
  }, [users, nameFilter, emailFilter, statusFilter]);

  const groupedUsers = useMemo(() => {
    const groups = new Map<string, { title: string; rows: TenantUserRow[] }>();
    for (const row of filteredUsers) {
      const key = String(row.tenantId);
      const existing = groups.get(key);
      if (existing) {
        existing.rows.push(row);
        continue;
      }
      groups.set(key, {
        title: resolveTenantLabel(row),
        rows: [row],
      });
    }
    return Array.from(groups.values());
  }, [filteredUsers, tenants]);

  function renderRows(rows: TenantUserRow[]) {
    return rows.map((row) => (
      <tr key={row.id}>
        <td className="px-3 py-2">{row.id}</td>
        <td className="px-3 py-2">{resolveTenantLabel(row)}</td>
        <td className="px-3 py-2">{row.user.nome}</td>
        <td className="px-3 py-2">{row.user.email}</td>
        <td className="px-3 py-2">{row.role?.nome || "-"}</td>
        <td className="px-3 py-2">{row.ativo ? "Ativo" : "Inativo"}</td>
        <td className="px-3 py-2">{row.user.forcePasswordChange ? "Sim" : "Nao"}</td>
        <td className="px-3 py-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-[color:var(--brand-navy)]/25 px-3 py-1 text-xs"
              onClick={() => openEditModal(row)}
            >
              Editar
            </button>
            <button
              type="button"
              className="rounded-full border border-[color:var(--brand-green)]/30 px-3 py-1 text-xs"
              onClick={() => void handleResetPassword(row)}
              disabled={resetting}
            >
              {resetting ? "Resetando..." : "Reset senha"}
            </button>
          </div>
        </td>
      </tr>
    ));
  }

  return (
    <PageShell title="Usuarios dos Tenants" scope="saas">
      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold text-[color:var(--brand-ink)]">Usuarios de Todos os Tenants</h2>
        <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
          Visualize todos os usuarios, filtre por tenant e use as acoes de editar e resetar senha temporaria.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <HelpLabel label="Filtro por tenant" help="Mostra usuarios de um tenant especifico ou de todos.">
            <select
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={tenantFilter}
              onChange={(event) => setTenantFilter(event.target.value)}
            >
              <option value="all">Todos os tenants</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.nome} ({tenant.slug})
                </option>
              ))}
            </select>
          </HelpLabel>

          <HelpLabel label="Filtro por nome" help="Busca parcial no nome do usuario.">
            <input
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              placeholder="Ex.: Maria"
            />
          </HelpLabel>

          <HelpLabel label="Filtro por e-mail" help="Busca parcial no e-mail do usuario.">
            <input
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={emailFilter}
              onChange={(event) => setEmailFilter(event.target.value)}
              placeholder="Ex.: @cliente.com"
            />
          </HelpLabel>

          <HelpLabel label="Filtro por status" help="Filtra por usuarios ativos ou inativos no tenant.">
            <select
              className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
            >
              <option value="all">Todos</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </HelpLabel>

          <label className="flex items-end gap-2 pb-2 text-sm text-[color:var(--brand-ink)]">
            <input
              type="checkbox"
              checked={groupByTenant}
              onChange={(event) => setGroupByTenant(event.target.checked)}
            />
            Agrupar resultados por tenant
          </label>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      {groupByTenant ? (
        <section className="grid gap-4">
          {groupedUsers.map((group) => (
            <article
              key={group.title}
              className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]"
            >
              <h3 className="mb-4 text-lg font-semibold text-[color:var(--brand-ink)]">{group.title}</h3>
              <TableBase headers={["ID vinculo", "Tenant", "Nome", "E-mail", "Perfil", "Status", "Troca senha", "Acoes"]}>
                {renderRows(group.rows)}
              </TableBase>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
          <h3 className="mb-4 text-lg font-semibold text-[color:var(--brand-ink)]">Tabela de usuarios</h3>
          {loading ? <p className="text-sm text-[color:var(--brand-navy)]/70">Carregando...</p> : null}
          <TableBase headers={["ID vinculo", "Tenant", "Nome", "E-mail", "Perfil", "Status", "Troca senha", "Acoes"]}>
            {renderRows(filteredUsers)}
          </TableBase>
        </section>
      )}

      {editingRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <section className="w-full max-w-lg rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-soft-lg)]">
            <h4 className="text-lg font-semibold text-[color:var(--brand-ink)]">Editar usuario</h4>
            <p className="mt-1 text-sm text-[color:var(--brand-navy)]/70">{resolveTenantLabel(editingRow)}</p>

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
                E-mail
                <input
                  type="email"
                  className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                  value={editForm.email}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[color:var(--brand-ink)]">
                ID do perfil (role)
                <input
                  type="number"
                  className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                  value={editForm.roleId}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, roleId: event.target.value }))}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-[color:var(--brand-ink)]">
                <input
                  type="checkbox"
                  checked={editForm.ativo}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, ativo: event.target.checked }))}
                />
                Usuario ativo neste tenant
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[color:var(--brand-navy)]/20 px-4 py-2 text-sm"
                onClick={() => {
                  setEditingRow(null);
                  setEditForm(emptyEditForm);
                }}
                disabled={savingEdit}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => void submitEdit()}
                disabled={savingEdit || !editForm.nome.trim() || !editForm.email.trim()}
              >
                {savingEdit ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {tempPasswordResult ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <section className="w-full max-w-md rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-soft-lg)]">
            <h4 className="text-lg font-semibold text-[color:var(--brand-ink)]">Senha temporaria gerada</h4>
            <div className="mt-3 text-sm text-[color:var(--brand-ink)]">
              <p>
                <strong>Usuario:</strong> {tempPasswordResult.userName}
              </p>
              <p>
                <strong>E-mail:</strong> {tempPasswordResult.userEmail}
              </p>
              <p className="mt-2 rounded-xl bg-[color:var(--brand-navy)]/5 px-3 py-2">
                <strong>Nova senha temporaria:</strong> {tempPasswordResult.tempPassword}
              </p>
              <p className="mt-2 text-xs text-[color:var(--brand-navy)]/70">
                O usuario devera trocar a senha no proximo login.
              </p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setTempPasswordResult(null)}
              >
                Fechar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
