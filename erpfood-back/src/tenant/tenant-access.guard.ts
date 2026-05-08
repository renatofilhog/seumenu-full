import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { TenantUser } from './entities/tenant-user.entity';
import { RequestTenant } from './types/request-tenant.type';

type TenantRequest = Request & { user?: JwtPayload; tenant?: RequestTenant };

@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(TenantUser)
    private readonly tenantUserRepository: Repository<TenantUser>,
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

    const tenant = request.tenant;
    if (!tenant) {
      throw new UnauthorizedException('Tenant nao resolvido para esta requisicao');
    }

    if (user.tenantId && user.tenantId !== tenant.id) {
      throw new ForbiddenException('Tenant do usuario nao corresponde ao contexto atual');
    }

    const tenantUser = await this.tenantUserRepository.findOne({
      where: {
        tenant: { id: tenant.id, ativo: true },
        user: { id: user.sub },
        ativo: true,
      },
      relations: {
        tenant: true,
      },
      select: {
        id: true,
        tenant: {
          id: true,
          ativo: true,
        },
      },
    });

    if (!tenantUser) {
      throw new ForbiddenException('Usuario sem vinculo com o tenant informado');
    }

    return true;
  }
}
