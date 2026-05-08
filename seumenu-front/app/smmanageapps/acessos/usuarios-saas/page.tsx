"use client";

import { useEffect, useState } from "react";
import { PageShell } from "../../../components/dashboard/PageShell";
import { TableBase } from "../../clientes/components/TableBase";
import {
  fetchSaasManagementUsers,
  fetchSaasRoles,
  updateSaasManagementUser,
} from "../acessos-api";
import type { SaasManagementUserRow, SaasRoleOption } from "../acessos-api";

type EditForm = {
  nome: string;
  email: string;
  roleId: string;
  ativo: boolean;
};

const emptyEditForm: EditForm = { nome: "", email: "", roleId: "", ativo: true };

export default function UsuariosSaasPage() {
  const [users, setUsers] = useState<SaasManagementUserRow[]>([]);
  const [roles, setRoles] = useState<SaasRoleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<SaasManagementUserRow | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        fetchSaasManagementUsers(),
        fetchSaasRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openEdit(user: SaasManagementUserRow) {
    setEditingUser(user);
    setEditForm({
      nome: user.nome,
      email: user.email,
      roleId: user.role?.id ? String(user.role.id) : "",
      ativo: user.ativo,
    });
  }

  async function saveEdit() {
    if (!editingUser) return;
    setSaving(true);
    setError(null);
    try {
      await updateSaasManagementUser(editingUser.id, {
        nome: editForm.nome.trim(),
        email: editForm.email.trim().toLowerCase(),
        roleId: editForm.roleId ? Number(editForm.roleId) : undefined,
        ativo: editForm.ativo,
      });
      setEditingUser(null);
      setEditForm(emptyEditForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar usuario SaaS");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="Usuarios SaaS" scope="saas">
      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold text-[color:var(--brand-ink)]">Usuarios com Acesso ao SMManageApps</h2>
        <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
          Edite usuarios que podem entrar no painel SaaS.
        </p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <h3 className="mb-4 text-lg font-semibold text-[color:var(--brand-ink)]">Tabela de usuarios SaaS</h3>
        {loading ? <p className="text-sm text-[color:var(--brand-navy)]/70">Carregando...</p> : null}
        <TableBase headers={["ID", "Nome", "E-mail", "Perfil", "Status", "Acao"]}>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-3 py-2">{user.id}</td>
              <td className="px-3 py-2">{user.nome}</td>
              <td className="px-3 py-2">{user.email}</td>
              <td className="px-3 py-2">{user.role?.nome ?? "-"}</td>
              <td className="px-3 py-2">{user.ativo ? "Ativo" : "Inativo"}</td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  className="rounded-full border border-[color:var(--brand-navy)]/25 px-3 py-1 text-xs"
                  onClick={() => openEdit(user)}
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </TableBase>
      </section>

      {editingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <section className="w-full max-w-lg rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-soft-lg)]">
            <h4 className="text-lg font-semibold text-[color:var(--brand-ink)]">Editar usuario SaaS</h4>
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
                Perfil SaaS
                <select
                  className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                  value={editForm.roleId}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, roleId: event.target.value }))}
                >
                  <option value="">Sem perfil</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-[color:var(--brand-ink)]">
                <input
                  type="checkbox"
                  checked={editForm.ativo}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, ativo: event.target.checked }))}
                />
                Usuario ativo
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[color:var(--brand-navy)]/20 px-4 py-2 text-sm"
                onClick={() => {
                  setEditingUser(null);
                  setEditForm(emptyEditForm);
                }}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => void saveEdit()}
                disabled={saving || !editForm.nome.trim() || !editForm.email.trim()}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
