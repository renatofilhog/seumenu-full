import { BadRequestException, Body, Controller, Get, MessageEvent, Param, Patch, Post, Query, Req, Sse, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { filter, map, merge, Observable } from 'rxjs';
import { interval } from 'rxjs';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { Pedido } from './entities/pedido.entity';
import { PedidoService } from './pedido.service';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { AddPedidoItensDto } from './dto/add-pedido-itens.dto';
import { UpdatePedidoStatusIdDto } from './dto/update-pedido-status-id.dto';
import { NoCacheInterceptor } from 'src/common/interceptors/no-cache.interceptor';
import { Request } from 'express';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { RequestTenant } from 'src/tenant/types/request-tenant.type';
import { FindPedidoQueryDto } from './dto/find-pedido-query.dto';
import { PedidoEvent } from './types/pedido-event.type';

type PedidoRequest = Request & {
  user?: JwtPayload;
  tenant?: RequestTenant;
};

@Controller('pedido')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Post()
  @UseInterceptors(NoCacheInterceptor)
  @ApiOkResponse({ type: Pedido })
  create(@Body() createPedidoDto: CreatePedidoDto, @Req() req?: PedidoRequest) {
    return this.pedidoService.create(createPedidoDto, this.resolveTenantId(req));
  }

  @Get()
  @UseInterceptors(NoCacheInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pedido.read')
  @ApiOkResponse({ type: Pedido, isArray: true })
  findAll(@Query() query: FindPedidoQueryDto, @Req() req?: PedidoRequest) {
    return this.pedidoService.findAll(this.resolveTenantId(req), query);
  }

  @Sse('events')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pedido.read')
  @ApiOkResponse({ description: 'Stream SSE tenant-scoped de eventos de pedidos.' })
  streamEvents(@Req() req?: PedidoRequest): Observable<MessageEvent> {
    const tenantId = this.resolveTenantId(req);

    const events$ = this.pedidoService.getPedidoEvents().pipe(
      filter((event) => event.pedido.tenantId === tenantId),
      map((event: PedidoEvent) => ({ data: event } as MessageEvent)),
    );

    // Keepalive ping every 25s prevents nginx from closing idle SSE connections.
    // The client ignores payloads with no pedido.id.
    const keepalive$ = interval(25_000).pipe(
      map(() => ({ data: { type: 'ping' } } as MessageEvent)),
    );

    return merge(events$, keepalive$);
  }

  @Get(':id')
  @UseInterceptors(NoCacheInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pedido.read')
  @ApiOkResponse({ type: Pedido })
  findOne(@Param('id') id: string, @Req() req?: PedidoRequest) {
    return this.pedidoService.findOne(+id, this.resolveTenantId(req));
  }

  @Get('status/:idOrNumero')
  @UseInterceptors(NoCacheInterceptor)
  @ApiOkResponse({
    schema: {
      example: { statusId: 1 },
    },
  })
  async getStatusId(@Param('idOrNumero') idOrNumero: string, @Req() req?: PedidoRequest) {
    const statusId = await this.pedidoService.getStatusIdByIdOrNumero(
      +idOrNumero,
      this.resolveTenantId(req),
    );
    return { statusId };
  }

  @Sse('status/events/:idOrNumero')
  @ApiOkResponse({ description: 'Stream SSE publico do status de um pedido especifico.' })
  async streamStatusEvents(
    @Param('idOrNumero') idOrNumero: string,
    @Req() req?: PedidoRequest,
  ): Promise<Observable<MessageEvent>> {
    const tenantId = this.resolveTenantId(req);
    const pedido = await this.pedidoService.findByIdOrNumero(+idOrNumero, tenantId);
    if (!pedido) {
      throw new BadRequestException('Pedido informado nao existe.');
    }

    return this.pedidoService.getPedidoEvents().pipe(
      filter(
        (event) =>
          event.pedido.tenantId === tenantId &&
          (event.pedido.id === pedido.id || event.pedido.numero === pedido.numero),
      ),
      map((event: PedidoEvent) => ({
        data: {
          pedidoId: event.pedido.id,
          numero: event.pedido.numero,
          statusId: event.pedido.status?.id ?? null,
          type: event.type,
        },
      })),
    );
  }

  @Patch('status/:id')
  @UseInterceptors(NoCacheInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pedido.status.update')
  @ApiBody({ type: UpdatePedidoStatusIdDto })
  @ApiOkResponse({ type: Pedido })
  updateStatus(
    @Param('id') id: string,
    @Body() updatePedidoStatusIdDto: UpdatePedidoStatusIdDto,
    @Req() req?: PedidoRequest,
  ) {
    return this.pedidoService.updateStatusById(
      +id,
      updatePedidoStatusIdDto.statusId,
      this.resolveTenantId(req),
    );
  }

  @Post('numero/:numero/itens')
  @UseInterceptors(NoCacheInterceptor)
  @ApiBody({ type: AddPedidoItensDto })
  @ApiOkResponse({ type: Pedido })
  addItens(
    @Param('numero') numero: string,
    @Body() addPedidoItensDto: AddPedidoItensDto,
    @Req() req?: PedidoRequest,
  ) {
    return this.pedidoService.addItensByNumero(
      +numero,
      addPedidoItensDto.itens,
      this.resolveTenantId(req),
    );
  }

  @ApiBody({ type: CreatePedidoDto })
  @ApiOkResponse({ type: Pedido })
  @Patch(':id')
  @UseInterceptors(NoCacheInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('pedido.update')
  update(@Param('id') id: string, @Body() updatePedidoDto: UpdatePedidoDto, @Req() req?: PedidoRequest) {
    return this.pedidoService.update(+id, updatePedidoDto, this.resolveTenantId(req));
  }

  private resolveTenantId(req?: PedidoRequest) {
    const tenantId = req?.user?.tenantId ?? req?.tenant?.id;
    if (!tenantId) {
      throw new BadRequestException('Tenant nao resolvido para esta requisicao');
    }
    return tenantId;
  }
}
