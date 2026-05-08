import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { Mesa } from './entities/mesa.entity';
import { MesaService } from './mesa.service';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Request } from 'express';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { RequestTenant } from 'src/tenant/types/request-tenant.type';

type MesaRequest = Request & {
  user?: JwtPayload;
  tenant?: RequestTenant;
};

@Controller('mesa')
export class MesaController {
  constructor(private readonly mesaService: MesaService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('mesa.create')
  @ApiOkResponse({ type: Mesa })
  create(@Body() createMesaDto: CreateMesaDto, @Req() req?: MesaRequest) {
    return this.mesaService.create(createMesaDto, this.resolveTenantId(req));
  }

  @Get()
  @ApiOkResponse({ type: Mesa, isArray: true })
  findAll(@Req() req?: MesaRequest) {
    return this.mesaService.findAll(this.resolveTenantId(req));
  }

  @Get(':id')
  @ApiOkResponse({ type: Mesa })
  findOne(@Param('id') id: string, @Req() req?: MesaRequest) {
    return this.mesaService.findOne(+id, this.resolveTenantId(req));
  }

  @Get(':id/tem-pedido-recente')
  @ApiOkResponse({
    schema: {
      example: {
        hasPedidoRecente: true,
      },
    },
  })
  async hasPedidoRecente(@Param('id') id: string, @Req() req?: MesaRequest) {
    const hasPedidoRecente = await this.mesaService.hasPedidoRecente(
      +id,
      this.resolveTenantId(req),
    );
    return { hasPedidoRecente };
  }

  @ApiBody({ type: CreateMesaDto })
  @ApiOkResponse({ type: Mesa })
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('mesa.update')
  update(@Param('id') id: string, @Body() updateMesaDto: UpdateMesaDto, @Req() req?: MesaRequest) {
    return this.mesaService.update(+id, updateMesaDto, this.resolveTenantId(req));
  }

  private resolveTenantId(req?: MesaRequest): number;
  private resolveTenantId(req: MesaRequest | undefined, required: false): number | undefined;
  private resolveTenantId(req?: MesaRequest, required = true): number | undefined {
    const tenantId = req?.user?.tenantId ?? req?.tenant?.id;
    if (!tenantId && required) {
      throw new BadRequestException('Tenant nao resolvido para esta requisicao');
    }
    return tenantId;
  }
}
