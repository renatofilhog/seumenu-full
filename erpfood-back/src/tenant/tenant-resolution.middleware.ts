import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { NextFunction, Request, Response } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Repository } from 'typeorm';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { TENANT_CONTEXT_COOKIE } from './constants/tenant-context-cookie.constant';
import { TenantDomain } from './entities/tenant-domain.entity';
import { Tenant } from './entities/tenant.entity';
import { TenantContextJwtPayload } from './types/tenant-context-jwt-payload.type';
import { RequestTenant } from './types/request-tenant.type';

type TenantRequest = Request & { tenant?: RequestTenant };
const PUBLIC_TENANT_CONTEXT_MODE = 'public';
const TENANT_CONTEXT_MODE_HEADER = 'x-tenant-context-mode';

@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantDomain)
    private readonly tenantDomainRepository: Repository<TenantDomain>,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    const isPublicTenantContextRequest = this.isPublicTenantContextRequest(req);

    if (!isPublicTenantContextRequest) {
      const tenantFromAuthToken = await this.resolveTenantFromAuthorizationToken(req);
      if (tenantFromAuthToken) {
        req.tenant = tenantFromAuthToken;
        return next();
      }
    }

    const tenantFromCookie = await this.resolveTenantFromContextCookie(req, res);
    if (tenantFromCookie === 'invalid') {
      return;
    }
    if (tenantFromCookie) {
      req.tenant = tenantFromCookie;
      return next();
    }

    const slug = this.getSlug(req);
    if (slug) {
      const tenantBySlug = await this.tenantRepository.findOne({
        where: { slug, ativo: true },
        select: { id: true, slug: true, nome: true },
      });

      if (tenantBySlug) {
        req.tenant = {
          id: tenantBySlug.id,
          slug: tenantBySlug.slug,
          nome: tenantBySlug.nome,
          matchedBy: 'slug',
        };
        return next();
      }
    }

    const host = this.getHost(req);
    if (!host) {
      return next();
    }

    const tenantByDomain = await this.tenantRepository.findOne({
      where: { dominio: host, ativo: true },
      select: { id: true, slug: true, nome: true },
    });

    if (tenantByDomain) {
      req.tenant = {
        id: tenantByDomain.id,
        slug: tenantByDomain.slug,
        nome: tenantByDomain.nome,
        matchedBy: 'dominio',
      };
      return next();
    }

    const subdomain = this.extractSubdomain(host);
    const tenantDomain = await this.tenantDomainRepository.findOne({
      where: subdomain ? [{ domain: host }, { subdomain }] : [{ domain: host }],
      relations: { tenant: true },
    });

    if (tenantDomain?.tenant?.ativo) {
      req.tenant = {
        id: tenantDomain.tenant.id,
        slug: tenantDomain.tenant.slug,
        nome: tenantDomain.tenant.nome,
        matchedBy: tenantDomain.domain === host ? 'dominio' : 'subdominio',
      };
      return next();
    }

    if (!subdomain) {
      return next();
    }

    const tenantBySubdomain = await this.tenantRepository.findOne({
      where: { subdominio: subdomain, ativo: true },
      select: { id: true, slug: true, nome: true },
    });

    if (tenantBySubdomain) {
      req.tenant = {
        id: tenantBySubdomain.id,
        slug: tenantBySubdomain.slug,
        nome: tenantBySubdomain.nome,
        matchedBy: 'subdominio',
      };
      return next();
    }

    return next();
  }

  private async resolveTenantFromContextCookie(
    req: Request,
    res: Response,
  ): Promise<RequestTenant | 'invalid' | null> {
    const token = this.getCookie(req, TENANT_CONTEXT_COOKIE);
    if (!token) {
      return null;
    }

    let payload: TenantContextJwtPayload;
    try {
      payload = this.jwtService.verify<TenantContextJwtPayload>(token);
    } catch {
      res.status(401).json({ message: 'Token de contexto do tenant invalido ou expirado' });
      return 'invalid';
    }

    if (payload.tokenType !== 'tenant_context' || !payload.tenantId) {
      res.status(401).json({ message: 'Token de contexto do tenant invalido ou expirado' });
      return 'invalid';
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id: payload.tenantId, ativo: true },
      select: { id: true, slug: true, nome: true },
    });
    if (!tenant || tenant.slug !== payload.slug) {
      res.status(401).json({ message: 'Tenant do token de contexto nao e valido' });
      return 'invalid';
    }

    return {
      id: tenant.id,
      slug: tenant.slug,
      nome: tenant.nome,
      matchedBy: 'cookie',
    };
  }

  private getHost(req: Request): string | null {
    const xTenantHost = req.headers['x-tenant-host'];
    const forwardedHost = req.headers['x-forwarded-host'];
    const hostHeader = req.headers.host;
    const fallback = req.hostname;

    const rawHost = (Array.isArray(xTenantHost) ? xTenantHost[0] : xTenantHost)
      ?? (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost)
      ?? (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader)
      ?? fallback;

    if (!rawHost) {
      return null;
    }

    return rawHost.split(':')[0]?.toLowerCase() ?? null;
  }

  private getSlug(req: Request): string | null {
    const raw = req.headers['x-tenant-slug'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized || !/^[a-z0-9-]+$/.test(normalized)) {
      return null;
    }

    return normalized;
  }

  private async resolveTenantFromAuthorizationToken(req: Request): Promise<RequestTenant | null> {
    const user = this.getAuthUserFromBearerToken(req);
    if (!user?.tenantId || user.principalType !== 'app_user') {
      return null;
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id: user.tenantId, ativo: true },
      select: { id: true, slug: true, nome: true },
    });
    if (!tenant) {
      return null;
    }

    return {
      id: tenant.id,
      slug: tenant.slug,
      nome: tenant.nome,
      matchedBy: 'auth_token',
    };
  }

  private isPublicTenantContextRequest(req: Request): boolean {
    const rawMode = req.headers[TENANT_CONTEXT_MODE_HEADER];
    const mode = Array.isArray(rawMode) ? rawMode[0] : rawMode;
    return mode?.trim().toLowerCase() === PUBLIC_TENANT_CONTEXT_MODE;
  }

  private getAuthUserFromBearerToken(req: Request): JwtPayload | null {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      return null;
    }

    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  private getCookie(req: Request, name: string): string | null {
    const rawCookie = req.headers.cookie;
    if (!rawCookie) {
      return null;
    }

    const parsed = rawCookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));
    if (!parsed) {
      return null;
    }

    const value = parsed.slice(name.length + 1).trim();
    return value ? decodeURIComponent(value) : null;
  }

  private extractSubdomain(host: string): string | null {
    if (!host.includes('.')) {
      return null;
    }

    const parts = host.split('.');
    if (parts.length < 3) {
      return null;
    }

    return parts[0] ?? null;
  }
}
