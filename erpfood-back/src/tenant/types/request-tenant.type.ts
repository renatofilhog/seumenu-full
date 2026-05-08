export type RequestTenant = {
  id: number;
  slug: string;
  nome: string;
  matchedBy: 'dominio' | 'subdominio' | 'slug' | 'cookie' | 'auth_token';
};
