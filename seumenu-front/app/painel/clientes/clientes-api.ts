import { apiRequest } from "../../lib/api";

export type Tenant = {
  id: number;
  nome: string;
  slug: string;
  dominio?: string | null;
  subdominio?: string | null;
  ativo: boolean;
};

export type License = {
  id: number;
  planType: string;
  status: "active" | "suspended" | "expired" | "trial";
  startsAt: string;
  expiresAt: string;
};

export type TenantUserRow = {
  id: number;
  ativo: boolean;
  role: { id: number; nome: string } | null;
  user: { id: number; nome: string; email: string };
};

export async function fetchTenants() {
  return apiRequest<Tenant[]>("/tenant-admin/tenants", { method: "GET" });
}

export async function createTenant(payload: {
  nome: string;
  slug: string;
  dominio?: string;
  subdominio?: string;
}) {
  return apiRequest<Tenant>("/tenant-admin/tenants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTenant(id: number, payload: Partial<Tenant>) {
  return apiRequest(`/tenant-admin/tenants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchTenantLicenses(tenantId: number) {
  return apiRequest<License[]>(`/tenant-admin/tenants/${tenantId}/licenses`, { method: "GET" });
}

export async function createTenantLicense(tenantId: number, payload: Record<string, unknown>) {
  return apiRequest(`/tenant-admin/tenants/${tenantId}/licenses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateLicense(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/tenant-admin/licenses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchTenantUsers(tenantId: number) {
  return apiRequest<TenantUserRow[]>(`/tenant-admin/tenants/${tenantId}/users`, { method: "GET" });
}

export async function createTenantUser(tenantId: number, payload: Record<string, unknown>) {
  return apiRequest(`/tenant-admin/tenants/${tenantId}/users`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTenantUser(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/tenant-admin/tenant-users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function provisionTenant(payload: Record<string, unknown>) {
  return apiRequest("/tenant-admin/provisioning", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
