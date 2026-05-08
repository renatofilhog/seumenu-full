import {
  BadRequestException,
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Patch,
  Req,
  Sse,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { PedidoStatusColumnDto } from './dto/pedido-status-column.dto';
import { PedidoStatusOptionDto } from './dto/pedido-status-option.dto';
import { UpdatePedidoStatusDto } from './dto/update-pedido-status.dto';
import { PedidoStatusService } from './pedido-status.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { NoCacheInterceptor } from 'src/common/interceptors/no-cache.interceptor';
import { Request } from 'express';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { RequestTenant } from 'src/tenant/types/request-tenant.type';

type PedidoStatusRequest = Request & {
  user?: JwtPayload;
  tenant?: RequestTenant;
};

@Controller('pedido-status')
@UseInterceptors(NoCacheInterceptor)
export class PedidoStatusController {
  constructor(private readonly pedidoStatusService: PedidoStatusService) {}

  @Get()
  @ApiOkResponse({ type: PedidoStatusOptionDto, isArray: true })
  listStatuses() {
    return this.pedidoStatusService.getStatusOptions();
  }

  @Get('kanban')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pedido.read')
  @ApiOkResponse({ type: PedidoStatusColumnDto, isArray: true })
  getKanban(@Req() req?: PedidoStatusRequest) {
    return this.pedidoStatusService.getKanban(this.resolveTenantId(req));
  }

  @ApiBody({ type: UpdatePedidoStatusDto })
  @ApiOkResponse({ type: Pedido })
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pedido-status.update')
  updateStatus(
    @Param('id') id: string,
    @Body() updatePedidoStatusDto: UpdatePedidoStatusDto,
    @Req() req?: PedidoStatusRequest,
  ) {
    return this.pedidoStatusService.updateStatus(
      +id,
      updatePedidoStatusDto.status,
      this.resolveTenantId(req),
    );
  }

  @Sse('stream')
  @ApiOkResponse({ description: 'Stream de atualizacoes de status.' })
  streamStatus(): Observable<MessageEvent> {
    return this.pedidoStatusService
      .getStatusUpdates()
      .pipe(map((pedido) => ({ data: pedido })));
  }

  private resolveTenantId(req?: PedidoStatusRequest) {
    const tenantId = req?.user?.tenantId ?? req?.tenant?.id;
    if (!tenantId) {
      throw new BadRequestException('Tenant nao resolvido para esta requisicao');
    }
    return tenantId;
  }
}
