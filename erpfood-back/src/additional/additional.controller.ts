import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { AdditionalService } from './additional.service';
import { CreateAdditionalDto } from './dto/create-additional.dto';
import { UpdateAdditionalDto } from './dto/update-additional.dto';
import { Additional } from './entities/additional.entity';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Request } from 'express';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { RequestTenant } from 'src/tenant/types/request-tenant.type';

type AdditionalRequest = Request & {
  user?: JwtPayload;
  tenant?: RequestTenant;
};

@Controller('additional')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdditionalController {
  constructor(private readonly additionalService: AdditionalService) {}

  @Post()
  @Permissions('additional.create')
  @ApiOkResponse({ type: Additional })
  create(@Body() createAdditionalDto: CreateAdditionalDto, @Req() req?: AdditionalRequest) {
    return this.additionalService.create(createAdditionalDto, this.resolveTenantId(req));
  }

  @Get()
  @Permissions('additional.read')
  @ApiOkResponse({ type: Additional, isArray: true })
  findAll(@Req() req?: AdditionalRequest) {
    return this.additionalService.findAll(this.resolveTenantId(req));
  }

  @Get(':id')
  @Permissions('additional.read')
  @ApiOkResponse({ type: Additional })
  findOne(@Param('id') id: string, @Req() req?: AdditionalRequest) {
    return this.additionalService.findOne(+id, this.resolveTenantId(req));
  }

  @ApiBody({ type: CreateAdditionalDto })
  @ApiOkResponse({ type: Additional })
  @Patch(':id')
  @Permissions('additional.update')
  update(@Param('id') id: string, @Body() updateAdditionalDto: UpdateAdditionalDto, @Req() req?: AdditionalRequest) {
    return this.additionalService.update(+id, updateAdditionalDto, this.resolveTenantId(req));
  }

  private resolveTenantId(req?: AdditionalRequest) {
    const tenantId = req?.user?.tenantId ?? req?.tenant?.id;
    if (!tenantId) {
      throw new BadRequestException('Tenant nao resolvido para esta requisicao');
    }
    return tenantId;
  }
}
