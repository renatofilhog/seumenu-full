import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

type TenantDomainRow = {
  domain: string | null;
  subdomain: string | null;
};

type TenantRow = {
  dominio: string | null;
  subdominio: string | null;
};

export class TenantCorsOriginResolver {
  private readonly logger = new Logger(TenantCorsOriginResolver.name);
  private readonly staticOrigins: Set<string>;
  private readonly cacheTtlMs: number;

  private allowedDomains = new Set<string>();
  private allowedSubdomains = new Set<string>();
  private lastLoadedAt = 0;
  private refreshPromise: Promise<void> | null = null;

  constructor(
    private readonly dataSource: DataSource,
    staticOrigins: string[],
    cacheTtlMs = 60_000,
  ) {
    this.staticOrigins = new Set(
      staticOrigins
        .map((origin) => this.normalizeOrigin(origin))
        .filter((origin): origin is string => Boolean(origin)),
    );
    this.cacheTtlMs = cacheTtlMs;
  }

  async isAllowed(origin?: string): Promise<boolean> {
    if (!origin) {
      // Non-browser requests (curl/server-to-server) may have no Origin header.
      return true;
    }

    const normalizedOrigin = this.normalizeOrigin(origin);
    if (!normalizedOrigin) {
      return false;
    }

    if (this.staticOrigins.has(normalizedOrigin)) {
      return true;
    }

    const host = this.extractHostFromOrigin(normalizedOrigin);
    if (!host) {
      return false;
    }

    await this.refreshCacheIfNeeded();

    if (this.allowedDomains.has(host)) {
      return true;
    }

    const subdomain = this.extractSubdomain(host);
    if (subdomain && this.allowedSubdomains.has(subdomain)) {
      return true;
    }

    return false;
  }

  private async refreshCacheIfNeeded() {
    const now = Date.now();
    if (now - this.lastLoadedAt <= this.cacheTtlMs && this.lastLoadedAt > 0) {
      return;
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.reloadFromDatabase()
        .catch((error) => {
          this.logger.error(
            JSON.stringify({
              event: 'cors.dynamic.reload.failed',
              message: error instanceof Error ? error.message : 'unknown error',
            }),
          );
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    await this.refreshPromise;
  }

  private async reloadFromDatabase() {
    const [tenantDomainRows, tenantRows] = await Promise.all([
      this.dataSource.query(
        `
          SELECT td.domain, td.subdomain
          FROM tenant_domains td
          INNER JOIN tenants t ON t.id = td.tenant_id
          WHERE t.ativo = true
        `,
      ) as Promise<TenantDomainRow[]>,
      this.dataSource.query(
        `
          SELECT dominio, subdominio
          FROM tenants
          WHERE ativo = true
        `,
      ) as Promise<TenantRow[]>,
    ]);

    const domains = new Set<string>();
    const subdomains = new Set<string>();

    for (const row of tenantDomainRows) {
      const domain = this.normalizeHost(row.domain);
      if (domain) {
        domains.add(domain);
      }

      const subdomain = this.normalizeSubdomain(row.subdomain);
      if (subdomain) {
        subdomains.add(subdomain);
      }
    }

    for (const row of tenantRows) {
      const domain = this.normalizeHost(row.dominio);
      if (domain) {
        domains.add(domain);
      }

      const subdomain = this.normalizeSubdomain(row.subdominio);
      if (subdomain) {
        subdomains.add(subdomain);
      }
    }

    this.allowedDomains = domains;
    this.allowedSubdomains = subdomains;
    this.lastLoadedAt = Date.now();

    this.logger.log(
      JSON.stringify({
        event: 'cors.dynamic.reload.success',
        domains: domains.size,
        subdomains: subdomains.size,
      }),
    );
  }

  private normalizeOrigin(origin?: string | null): string | null {
    if (!origin) {
      return null;
    }

    const trimmed = origin.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const url = new URL(trimmed);
      return `${url.protocol}//${url.host}`.toLowerCase();
    } catch {
      return null;
    }
  }

  private extractHostFromOrigin(origin: string): string | null {
    try {
      return new URL(origin).hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  private normalizeHost(host?: string | null): string | null {
    if (!host) {
      return null;
    }
    const trimmed = host.trim().toLowerCase();
    if (!trimmed) {
      return null;
    }

    const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
    const withoutPath = withoutProtocol.split('/')[0] ?? '';
    const hostname = withoutPath.split(':')[0] ?? '';
    return hostname || null;
  }

  private normalizeSubdomain(subdomain?: string | null): string | null {
    if (!subdomain) {
      return null;
    }

    return subdomain.trim().toLowerCase() || null;
  }

  private extractSubdomain(host: string): string | null {
    if (!host.includes('.')) {
      return null;
    }

    const parts = host.split('.');
    if (parts.length < 3) {
      return null;
    }

    return parts[0]?.toLowerCase() ?? null;
  }
}
