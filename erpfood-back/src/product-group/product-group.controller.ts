import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';
import { ProductGroupService } from './product-group.service';
import { ProductGroup } from './entities/product-group.entity';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Request } from 'express';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { RequestTenant } from 'src/tenant/types/request-tenant.type';

type ProductGroupRequest = Request & {
  user?: JwtPayload;
  tenant?: RequestTenant;
};

@Controller('product-group')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductGroupController {
  constructor(private readonly productGroupService: ProductGroupService) {}

  @Post()
  @Permissions('product-group.create')
  @ApiOkResponse({ type: ProductGroup })
  create(@Body() createProductGroupDto: CreateProductGroupDto, @Req() req?: ProductGroupRequest) {
    return this.productGroupService.create(createProductGroupDto, this.resolveTenantId(req));
  }

  @Get()
  @Permissions('product-group.read')
  @ApiOkResponse({ type: ProductGroup, isArray: true })
  findAll(@Req() req?: ProductGroupRequest) {
    return this.productGroupService.findAll(this.resolveTenantId(req));
  }

  @Get(':id')
  @Permissions('product-group.read')
  @ApiOkResponse({ type: ProductGroup })
  findOne(@Param('id') id: string, @Req() req?: ProductGroupRequest) {
    return this.productGroupService.findOne(+id, this.resolveTenantId(req));
  }

  @ApiBody({ type: CreateProductGroupDto })
  @ApiOkResponse({ type: ProductGroup })
  @Patch(':id')
  @Permissions('product-group.update')
  update(@Param('id') id: string, @Body() updateProductGroupDto: UpdateProductGroupDto, @Req() req?: ProductGroupRequest) {
    return this.productGroupService.update(+id, updateProductGroupDto, this.resolveTenantId(req));
  }

  @Delete(':id')
  @ApiOkResponse({ type: ProductGroup })
  @Permissions('product-group.delete')
  remove(@Param('id') id: string, @Req() req?: ProductGroupRequest) {
    return this.productGroupService.remove(+id, this.resolveTenantId(req));
  }

  private resolveTenantId(req?: ProductGroupRequest) {
    const tenantId = req?.user?.tenantId ?? req?.tenant?.id;
    if (!tenantId) {
      throw new BadRequestException('Tenant nao resolvido para esta requisicao');
    }
    return tenantId;
  }
}
