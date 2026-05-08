import { Controller, Get, NotFoundException, Param, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { RequestTenant } from './types/request-tenant.type';
import { TenantContextJwtPayload } from './types/tenant-context-jwt-payload.type';

type TenantRequest = Request & { tenant?: RequestTenant };

@ApiTags('tenant')
@Controller('tenant')
export class TenantPublicController {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly jwtService: JwtService,
  ) {}

  @Get('resolve')
  @ApiOkResponse()
  resolveTenant(@Req() req: TenantRequest) {
    if (!req.tenant) {
      throw new NotFoundException('Tenant nao encontrado para o contexto informado');
    }

    return req.tenant;
  }

  @Get('context/:slug')
  @ApiOkResponse()
  async resolveTenantContextBySlug(@Param('slug') slug: string) {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug || !/^[a-z0-9-]+$/.test(normalizedSlug)) {
      throw new NotFoundException('Tenant nao encontrado para o slug informado');
    }

    const tenant = await this.tenantRepository.findOne({
      where: { slug: normalizedSlug, ativo: true },
      select: { id: true, slug: true, nome: true },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant nao encontrado para o slug informado');
    }

    const payload: TenantContextJwtPayload = {
      tokenType: 'tenant_context',
      tenantId: tenant.id,
      slug: tenant.slug,
      nome: tenant.nome,
    };

    return {
      token: this.jwtService.sign(payload),
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        nome: tenant.nome,
      },
    };
  }
}
