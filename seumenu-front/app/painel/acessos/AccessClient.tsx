"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";
import { BrandLoading } from "../../components/shared/BrandLoading";

type Role = {
  id: number;
  nome: string;
  descricao: string;
  permissions?: string[];
};

type User = {
  id: number;
  nome: string;
  email: string;
  role?: Role;
};

type Permission = {
  id: number;
  nome: string;
  descricao: string;
  roles?: string[];
};

type UserFormState = {
  id: number | null;
  nome: string;
  email: string;
  senha: string;
  roleId: string;
};

type RoleFormState = {
  id: number | null;
  nome: string;
  descricao: string;
  permissionIds: number[];
};

type PermissionFormState = {
  id: number | null;
  nome: string;
  descricao: string;
  roleIds: number[];
};

type ModalState =
  | { type: "user"; open: boolean }
  | { type: "role"; open: boolean }
  | { type: "permission"; open: boolean };

const emptyUserForm: UserFormState = {
  id: null,
  nome: "",
  email: "",
  senha: "",
  roleId: "",
};

const emptyRoleForm: RoleFormState = {
  id: null,
  nome: "",
  descricao: "",
  permissionIds: [],
};

const emptyPermissionForm: PermissionFormState = {
  id: null,
  nome: "",
  descricao: "",
  roleIds: [],
};

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  return apiRequest<T>(path, options);
}

export function AccessClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: "user", open: false });
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [roleForm, setRoleForm] = useState<RoleFormState>(emptyRoleForm);
  const [permissionForm, setPermissionForm] = useState<PermissionFormState>(
    emptyPermissionForm
  );
  const [submitting, setSubmitting] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [userData, roleData, permissionData] = await Promise.all([
        requestJson<User[]>("/user"),
        requestJson<Role[]>("/role"),
        requestJson<Permission[]>("/permission"),
      ]);
      setUsers(userData);
      setRoles(roleData);
      setPermissions(permissionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const nome = user.nome.toLowerCase();
      const email = user.email.toLowerCase();
      const role = user.role?.nome?.toLowerCase() || "";
      return nome.includes(query) || email.includes(query) || role.includes(query);
    });
  }, [users, userSearch]);

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) => {
      const nome = role.nome.toLowerCase();
      const descricao = role.descricao.toLowerCase();
      return nome.includes(query) || descricao.includes(query);
    });
  }, [roles, roleSearch]);

  const filteredPermissions = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    if (!query) return permissions;
    return permissions.filter((permission) => {
      const nome = permission.nome.toLowerCase();
      const descricao = permission.descricao.toLowerCase();
      return nome.includes(query) || descricao.includes(query);
    });
  }, [permissions, permissionSearch]);

  function openUserModal(user?: User) {
    if (user) {
      setUserForm({
        id: user.id,
        nome: user.nome,
        email: user.email,
        senha: "",
        roleId: user.role ? String(user.role.id) : "",
      });
    } else {
      setUserForm(emptyUserForm);
    }
    setModal({ type: "user", open: true });
  }

  function openRoleModal(role?: Role) {
    if (role) {
      setRoleForm({
        id: role.id,
        nome: role.nome,
        descricao: role.descricao,
        permissionIds: [],
      });
    } else {
      setRoleForm(emptyRoleForm);
    }
    setModal({ type: "role", open: true });
  }

  function openPermissionModal(permission?: Permission) {
    if (permission) {
      setPermissionForm({
        id: permission.id,
        nome: permission.nome,
        descricao: permission.descricao,
        roleIds: [],
      });
    } else {
      setPermissionForm(emptyPermissionForm);
    }
    setModal({ type: "permission", open: true });
  }

  function closeModal() {
    setModal((prev) => ({ ...prev, open: false }));
  }

  async function handleUserSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        nome: userForm.nome,
        email: userForm.email,
        senha: userForm.senha,
        roleId: Number(userForm.roleId),
      };

      if (userForm.id) {
        await requestJson<User>(`/user/${userForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await requestJson<User>("/user", {
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

  async function handleRoleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        nome: roleForm.nome,
        descricao: roleForm.descricao,
        permissionIds: roleForm.permissionIds,
      };

      if (roleForm.id) {
        await requestJson<Role>(`/role/${roleForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await requestJson<Role>("/role", {
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

  async function handlePermissionSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        nome: permissionForm.nome,
        descricao: permissionForm.descricao,
        roleIds: permissionForm.roleIds,
      };

      if (permissionForm.id) {
        await requestJson<Permission>(`/permission/${permissionForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await requestJson<Permission>("/permission", {
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

  async function handleDelete(path: string) {
    setSubmitting(true);
    setError(null);
    try {
      await requestJson<void>(path, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
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
              Acessos
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--brand-ink)]">
              Usuarios, papeis e permissoes
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white"
              type="button"
              onClick={() => openUserModal()}
            >
              Novo usuario
            </button>
            <button
              className="rounded-full border border-[color:var(--brand-navy)]/20 px-4 py-2 text-xs font-semibold text-[color:var(--brand-navy)]"
              type="button"
              onClick={() => openRoleModal()}
            >
              Novo papel
            </button>
            <button
              className="rounded-full border border-[color:var(--brand-navy)]/20 px-4 py-2 text-xs font-semibold text-[color:var(--brand-navy)]"
              type="button"
              onClick={() => openPermissionModal()}
            >
              Nova permissao
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--brand-red)]/40 bg-[color:var(--brand-red)]/10 p-4 text-sm text-[color:var(--brand-ink)]">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
              Usuarios ativos
            </h3>
            <label className="text-xs text-[color:var(--brand-navy)]/70">
              Buscar
              <input
                className="mt-2 w-full min-w-[220px] rounded-full border border-[color:var(--brand-navy)]/10 bg-white px-4 py-2 text-sm text-[color:var(--brand-ink)] md:w-72"
                type="search"
                placeholder="Nome, email ou papel"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
              />
            </label>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? (
              <BrandLoading size="sm" className="py-2" />
            ) : null}
            {!loading && filteredUsers.length === 0 ? (
              <p className="text-xs text-[color:var(--brand-navy)]/60">
                Nenhum usuario encontrado.
              </p>
            ) : null}
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] shadow-[var(--shadow-soft)] px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-[color:var(--brand-ink)]">
                    {user.nome}
                  </p>
                  <p className="text-xs text-[color:var(--brand-navy)]/70">
                    {user.email}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[color:var(--brand-yellow)]/25 px-3 py-1 text-xs text-[color:var(--brand-ink)]">
                    {user.role?.nome || "Sem papel"}
                  </span>
                  <button
                    className="rounded-full bg-white px-3 py-1 text-xs text-[color:var(--brand-navy)]"
                    type="button"
                    onClick={() => openUserModal(user)}
                    disabled={submitting}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-full bg-[color:var(--brand-red)]/15 px-3 py-1 text-xs text-[color:var(--brand-ink)]"
                    type="button"
                    onClick={() => handleDelete(`/user/${user.id}`)}
                    disabled={submitting}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
              Papeis
            </h3>
            <label className="text-xs text-[color:var(--brand-navy)]/70">
              Buscar
              <input
                className="mt-2 w-full min-w-[220px] rounded-full border border-[color:var(--brand-navy)]/10 bg-white px-4 py-2 text-sm text-[color:var(--brand-ink)] md:w-72"
                type="search"
                placeholder="Nome ou descricao"
                value={roleSearch}
                onChange={(event) => setRoleSearch(event.target.value)}
              />
            </label>
          </div>
          <div className="mt-4 space-y-3">
            {filteredRoles.map((role) => (
              <div
                key={role.id}
                className="rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] shadow-[var(--shadow-soft)] px-4 py-3 text-sm"
              >
                <p className="font-semibold text-[color:var(--brand-ink)]">
                  {role.nome}
                </p>
                <p className="text-xs text-[color:var(--brand-navy)]/70">
                  {role.descricao}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-full bg-white px-3 py-1 text-xs text-[color:var(--brand-navy)]"
                    type="button"
                    onClick={() => openRoleModal(role)}
                    disabled={submitting}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-full bg-[color:var(--brand-red)]/15 px-3 py-1 text-xs text-[color:var(--brand-ink)]"
                    type="button"
                    onClick={() => handleDelete(`/role/${role.id}`)}
                    disabled={submitting}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
            {filteredRoles.length === 0 ? (
              <p className="text-xs text-[color:var(--brand-navy)]/60">
                Nenhum papel encontrado.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
            Permissoes
          </h3>
          <label className="text-xs text-[color:var(--brand-navy)]/70">
            Buscar
            <input
              className="mt-2 w-full min-w-[220px] rounded-full border border-[color:var(--brand-navy)]/10 bg-white px-4 py-2 text-sm text-[color:var(--brand-ink)] md:w-72"
              type="search"
              placeholder="Nome ou descricao"
              value={permissionSearch}
              onChange={(event) => setPermissionSearch(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filteredPermissions.map((permission) => (
            <div
              key={permission.id}
              className="rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] shadow-[var(--shadow-soft)] px-4 py-3 text-sm"
            >
              <p className="font-semibold text-[color:var(--brand-ink)]">
                {permission.nome}
              </p>
              <p className="text-xs text-[color:var(--brand-navy)]/70">
                {permission.descricao}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="rounded-full bg-white px-3 py-1 text-xs text-[color:var(--brand-navy)]"
                  type="button"
                  onClick={() => openPermissionModal(permission)}
                  disabled={submitting}
                >
                  Editar
                </button>
                <button
                  className="rounded-full bg-[color:var(--brand-red)]/15 px-3 py-1 text-xs text-[color:var(--brand-ink)]"
                  type="button"
                  onClick={() => handleDelete(`/permission/${permission.id}`)}
                  disabled={submitting}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
          {filteredPermissions.length === 0 ? (
            <p className="text-xs text-[color:var(--brand-navy)]/60">
              Nenhuma permissao encontrada.
            </p>
          ) : null}
        </div>
      </section>

      {modal.open && modal.type === "user" ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft-lg)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
                {userForm.id ? "Editar usuario" : "Novo usuario"}
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
              className="mt-6 grid gap-4 rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] shadow-[var(--shadow-soft)] p-4 md:grid-cols-2"
              onSubmit={handleUserSubmit}
            >
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Nome
                <input
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="text"
                  value={userForm.nome}
                  onChange={(event) =>
                    setUserForm((prev) => ({
                      ...prev,
                      nome: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Email
                <input
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="email"
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Senha
                <input
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="password"
                  value={userForm.senha}
                  onChange={(event) =>
                    setUserForm((prev) => ({
                      ...prev,
                      senha: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Papel
                <select
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  value={userForm.roleId}
                  onChange={(event) =>
                    setUserForm((prev) => ({
                      ...prev,
                      roleId: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Selecione</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nome}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <button
                  className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "Salvando..."
                    : userForm.id
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

      {modal.open && modal.type === "role" ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft-lg)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
                {roleForm.id ? "Editar papel" : "Novo papel"}
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
              onSubmit={handleRoleSubmit}
            >
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Nome
                <input
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="text"
                  value={roleForm.nome}
                  onChange={(event) =>
                    setRoleForm((prev) => ({
                      ...prev,
                      nome: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Descricao
                <input
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="text"
                  value={roleForm.descricao}
                  onChange={(event) =>
                    setRoleForm((prev) => ({
                      ...prev,
                      descricao: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <div className="text-xs text-[color:var(--brand-navy)]/70">
                Permissoes
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {permissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center gap-2 rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-xs text-[color:var(--brand-ink)]"
                    >
                      <input
                        type="checkbox"
                        checked={roleForm.permissionIds.includes(permission.id)}
                        onChange={(event) => {
                          setRoleForm((prev) => ({
                            ...prev,
                            permissionIds: event.target.checked
                              ? [...prev.permissionIds, permission.id]
                              : prev.permissionIds.filter(
                                  (id) => id !== permission.id
                                ),
                          }));
                        }}
                      />
                      {permission.nome}
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
                    : roleForm.id
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

      {modal.open && modal.type === "permission" ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft-lg)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[color:var(--brand-ink)]">
                {permissionForm.id ? "Editar permissao" : "Nova permissao"}
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
              onSubmit={handlePermissionSubmit}
            >
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Nome
                <input
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="text"
                  value={permissionForm.nome}
                  onChange={(event) =>
                    setPermissionForm((prev) => ({
                      ...prev,
                      nome: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="text-xs text-[color:var(--brand-navy)]/70">
                Descricao
                <input
                  className="mt-2 w-full rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-sm text-[color:var(--brand-ink)]"
                  type="text"
                  value={permissionForm.descricao}
                  onChange={(event) =>
                    setPermissionForm((prev) => ({
                      ...prev,
                      descricao: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <div className="text-xs text-[color:var(--brand-navy)]/70">
                Papeis
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-2 rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-xs text-[color:var(--brand-ink)]"
                    >
                      <input
                        type="checkbox"
                        checked={permissionForm.roleIds.includes(role.id)}
                        onChange={(event) => {
                          setPermissionForm((prev) => ({
                            ...prev,
                            roleIds: event.target.checked
                              ? [...prev.roleIds, role.id]
                              : prev.roleIds.filter((id) => id !== role.id),
                          }));
                        }}
                      />
                      {role.nome}
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
                    : permissionForm.id
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
