export type TenantContextJwtPayload = {
  tokenType: 'tenant_context';
  tenantId: number;
  slug: string;
  nome: string;
};
