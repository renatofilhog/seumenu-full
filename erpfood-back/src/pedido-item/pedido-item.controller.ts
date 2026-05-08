import { BadRequestException, Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { CreatePedidoItemDto } from './dto/create-pedido-item.dto';
import { UpdatePedidoItemDto } from './dto/update-pedido-item.dto';
import { PedidoItem } from './entities/pedido-item.entity';
import { PedidoItemService } from './pedido-item.service';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Request } from 'express';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { RequestTenant } from 'src/tenant/types/request-tenant.type';

type PedidoItemRequest = Request & {
  user?: JwtPayload;
  tenant?: RequestTenant;
};

@Controller('pedido-item')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PedidoItemController {
  constructor(private readonly pedidoItemService: PedidoItemService) {}

  @Get()
  @Permissions('pedido-item.read')
  @ApiOkResponse({ type: PedidoItem, isArray: true })
  findAll(@Req() req?: PedidoItemRequest) {
    return this.pedidoItemService.findAll(this.resolveTenantId(req));
  }

  @Get(':id')
  @Permissions('pedido-item.read')
  @ApiOkResponse({ type: PedidoItem })
  findOne(@Param('id') id: string, @Req() req?: PedidoItemRequest) {
    return this.pedidoItemService.findOne(+id, this.resolveTenantId(req));
  }

  @ApiBody({ type: CreatePedidoItemDto })
  @ApiOkResponse({ type: PedidoItem })
  @Patch(':id')
  @Permissions('pedido-item.update')
  update(@Param('id') id: string, @Body() updatePedidoItemDto: UpdatePedidoItemDto, @Req() req?: PedidoItemRequest) {
    return this.pedidoItemService.update(+id, updatePedidoItemDto, this.resolveTenantId(req));
  }

  private resolveTenantId(req?: PedidoItemRequest) {
    const tenantId = req?.user?.tenantId ?? req?.tenant?.id;
    if (!tenantId) {
      throw new BadRequestException('Tenant nao resolvido para esta requisicao');
    }
    return tenantId;
  }
}
