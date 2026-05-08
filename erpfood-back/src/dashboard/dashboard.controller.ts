import { BadRequestException, Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { Request } from 'express';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { RequestTenant } from 'src/tenant/types/request-tenant.type';

type DashboardRequest = Request & {
  user?: JwtPayload;
  tenant?: RequestTenant;
};

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumo')
  @ApiOkResponse({
    schema: {
      example: {
        pedidosEmAndamentoHoje: 3,
        totalProdutos: 20,
        totalAdicionais: 5,
        totalGruposProdutos: 4,
        mesas: [],
        pedidosHoje: [],
      },
    },
  })
  @ApiBody({ type: String })
  getResumoDiario(@Req() req?: DashboardRequest) {
    return this.dashboardService.getResumoDiario(this.resolveTenantId(req));
  }

  private resolveTenantId(req?: DashboardRequest) {
    const tenantId = req?.user?.tenantId ?? req?.tenant?.id;
    if (!tenantId) {
      throw new BadRequestException('Tenant nao resolvido para esta requisicao');
    }
    return tenantId;
  }
}
