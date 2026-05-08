import { apiRequest } from "../../lib/api";

export type SaasRoleOption = {
  id: number;
  nome: string;
  descricao?: string | null;
};

export type SaasManagementUserRow = {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  role: { id: number; nome: string } | null;
};

export async function fetchSaasManagementUsers() {
  return apiRequest<SaasManagementUserRow[]>("/saas-management/users", {
    method: "GET",
    authScope: "saas",
  });
}

export async function fetchSaasRoles() {
  return apiRequest<SaasRoleOption[]>("/saas-management/roles", {
    method: "GET",
    authScope: "saas",
  });
}

export async function updateSaasManagementUser(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/saas-management/users/${id}`, {
    method: "PATCH",
    authScope: "saas",
    body: JSON.stringify(payload),
  });
}

export async function changeMySaasPassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return apiRequest<{ success: boolean }>("/saas-management/users/me/password", {
    method: "PATCH",
    authScope: "saas",
    body: JSON.stringify(payload),
  });
}
