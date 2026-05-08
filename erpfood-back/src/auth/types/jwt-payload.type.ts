export type JwtPayload = {
  sub: number;
  email: string;
  nome: string;
  principalType: 'app_user' | 'saas_management_user';
  tenantId?: number;
  roleId?: number;
  role?: string;
  forcePasswordChange?: boolean;
  permissions: string[];
};
