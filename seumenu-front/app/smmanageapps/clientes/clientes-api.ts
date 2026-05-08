import { apiRequest } from "../../lib/api";

export type Tenant = {
  id: number;
  nome: string;
  slug: string;
  dominio?: string | null;
  subdominio?: string | null;
  ativo: boolean;
  licenseModelId?: number | null;
  licenseModelName?: string | null;
  validUntil?: string | null;
  daysRemaining?: number | null;
};

export type License = {
  id: number;
  planType: string;
  status: "active" | "suspended" | "expired" | "trial";
  startsAt: string;
  expiresAt: string;
};

export type LicensePlanOption = {
  id: number;
  code: string;
  nome: string;
  type?: string;
  defaultDurationDays: number;
  durationMonths?: number;
  ativo: boolean;
};

export type TenantUserRow = {
  id: number;
  ativo: boolean;
  tenantId: number;
  tenant?: { id: number; nome: string; slug: string };
  role: { id: number; nome: string } | null;
  user: { id: number; nome: string; email: string; tenantId?: number; forcePasswordChange?: boolean };
};

export type SaasSummary = {
  activeTenants: number;
  licensesExpiringThisMonth: number;
  referenceDate: string;
  monthEndDate: string;
};

export async function fetchTenants() {
  return apiRequest<Tenant[]>("/tenant-admin/tenants", { method: "GET", authScope: "saas" });
}

export async function fetchSaasSummary() {
  return apiRequest<SaasSummary>("/tenant-admin/summary", { method: "GET", authScope: "saas" });
}

export async function createTenant(payload: {
  nome: string;
  slug: string;
  dominio?: string;
  subdominio?: string;
}) {
  return apiRequest<Tenant>("/tenant-admin/tenants", {
    method: "POST",
    authScope: "saas",
    body: JSON.stringify(payload),
  });
}

export async function updateTenant(id: number, payload: Partial<Tenant>) {
  return apiRequest(`/tenant-admin/tenants/${id}`, {
    method: "PATCH",
    authScope: "saas",
    body: JSON.stringify(payload),
  });
}

export async function fetchTenantLicenses(tenantId: number) {
  return apiRequest<License[]>(`/tenant-admin/tenants/${tenantId}/licenses`, { method: "GET", authScope: "saas" });
}

export async function createTenantLicense(tenantId: number, payload: Record<string, unknown>) {
  return apiRequest(`/tenant-admin/tenants/${tenantId}/licenses`, {
    method: "POST",
    authScope: "saas",
    body: JSON.stringify(payload),
  });
}

export async function updateLicense(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/tenant-admin/licenses/${id}`, {
    method: "PATCH",
    authScope: "saas",
    body: JSON.stringify(payload),
  });
}

export async function renewLicense(id: number, addedDays: number) {
  return apiRequest(`/tenant-admin/licenses/${id}/renew`, {
    method: "POST",
    authScope: "saas",
    body: JSON.stringify({ addedDays }),
  });
}

export async function renewTenantLicenseByModel(tenantId: number, licenseModelId: number) {
  return apiRequest<{
    tenantId: number;
    licenseId: number;
    licenseModelId: number;
    licenseModelName: string;
    validUntil: string;
    daysRemaining: number;
  }>(`/tenant-admin/tenants/${tenantId}/license/renew`, {
    method: "POST",
    authScope: "saas",
    body: JSON.stringify({ licenseModelId }),
  });
}

export async function fetchTenantUsers(tenantId: number) {
  return apiRequest<TenantUserRow[]>(`/tenant-admin/tenants/${tenantId}/users`, { method: "GET", authScope: "saas" });
}

export async function fetchAllTenantUsers(tenantId?: number) {
  const query = tenantId ? `?tenantId=${tenantId}` : "";
  return apiRequest<TenantUserRow[]>(`/tenant-admin/users${query}`, { method: "GET", authScope: "saas" });
}

export async function createTenantUser(tenantId: number, payload: Record<string, unknown>) {
  return apiRequest(`/tenant-admin/tenants/${tenantId}/users`, {
    method: "POST",
    authScope: "saas",
    body: JSON.stringify(payload),
  });
}

export async function updateTenantUser(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/tenant-admin/tenant-users/${id}`, {
    method: "PATCH",
    authScope: "saas",
    body: JSON.stringify(payload),
  });
}

export async function resetTenantUserPassword(id: number) {
  return apiRequest<{ tenantUserId: number; userId: number; tempPassword: string; forcePasswordChange: boolean }>(
    `/tenant-admin/tenant-users/${id}/reset-password`,
    {
      method: "POST",
      authScope: "saas",
    },
  );
}

export async function provisionTenant(payload: Record<string, unknown>) {
  return apiRequest("/tenant-admin/provisioning", {
    method: "POST",
    authScope: "saas",
    body: JSON.stringify(payload),
  });
}

export async function fetchActiveLicensePlans() {
  return apiRequest<LicensePlanOption[]>("/tenant-admin/license-plans", {
    method: "GET",
    authScope: "saas",
  });
}

export async function fetchAllLicensePlans() {
  return apiRequest<LicensePlanOption[]>("/tenant-admin/license-plans/all", {
    method: "GET",
    authScope: "saas",
  });
}

export async function createLicensePlanModel(payload: {
  code: string;
  nome: string;
  type: "subscription" | "trial" | "custom";
  defaultDurationDays: number;
  ativo?: boolean;
}) {
  return apiRequest("/tenant-admin/license-plans", {
    method: "POST",
    authScope: "saas",
    body: JSON.stringify(payload),
  });
}

export async function updateLicensePlanModel(id: number, payload: Partial<{
  code: string;
  nome: string;
  type: "subscription" | "trial" | "custom";
  defaultDurationDays: number;
  ativo: boolean;
}>) {
  return apiRequest(`/tenant-admin/license-plans/${id}`, {
    method: "PATCH",
    authScope: "saas",
    body: JSON.stringify(payload),
  });
}

export async function checkTenantSlugAvailability(slug: string) {
  return apiRequest<{ slug: string; available: boolean }>(`/tenant-admin/tenants/slug/${encodeURIComponent(slug)}/availability`, {
    method: "GET",
    authScope: "saas",
  });
}

export async function provisionTenantAssisted(payload: {
  tenantName: string;
  tenantSlug: string;
  tenantActive: boolean;
  domain?: string;
  subdomain?: string;
  planCode: string;
  licenseStatus: "active" | "trial" | "suspended" | "expired";
  externalRef?: string;
  store?: {
    nome?: string;
    cnpj?: string;
    resumo?: string;
    bannerUrl?: string;
    logoUrl?: string;
    horarioFuncionamento?: string;
    localizacao?: string;
    corFundo?: string;
    habilitaVerificacaoMesa?: boolean;
  };
  initialUsers?: Array<{
    nome: string;
    email: string;
    roleKey?: "admin" | "cozinha" | "atendimento";
    permissions?: string[];
  }>;
}) {
  return apiRequest("/tenant-admin/provisioning/assisted", {
    method: "POST",
    authScope: "saas",
    body: JSON.stringify(payload),
  });
}
