import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { RequestTenant } from 'src/tenant/types/request-tenant.type';
import { License } from './entities/license.entity';

type TenantRequest = Request & { user?: JwtPayload; tenant?: RequestTenant };

@Injectable()
export class LicenseAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(License)
    private readonly licenseRepository: Repository<License>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user;

    if (!user) {
      return true;
    }

    if (user.principalType === 'saas_management_user') {
      return request.path.startsWith('/tenant-admin');
    }

    if (request.path.startsWith('/user/me/password') || request.path.startsWith('/tenant/resolve')) {
      return true;
    }

    const tenant = request.tenant;
    if (!tenant) {
      throw new UnauthorizedException('Tenant nao resolvido para esta requisicao');
    }

    const license = await this.licenseRepository.findOne({
      where: { tenant: { id: tenant.id } },
      order: { id: 'DESC' },
      relations: { tenant: true },
    });

    if (!license) {
      throw new ForbiddenException('Licenca nao encontrada para o tenant');
    }

    const now = new Date();
    const cutoff = license.graceUntil ?? license.expiresAt;

    if (license.status === 'suspended' || license.status === 'expired') {
      throw new ForbiddenException('Licenca inativa para o tenant');
    }

    if (license.startsAt > now) {
      throw new ForbiddenException('Licenca ainda nao vigente');
    }

    if (cutoff < now) {
      await this.licenseRepository.update(license.id, {
        status: 'expired',
        lastCheckedAt: now,
      });
      throw new ForbiddenException('Licenca expirada para o tenant');
    }

    await this.licenseRepository.update(license.id, {
      lastCheckedAt: now,
    });

    return true;
  }
}
