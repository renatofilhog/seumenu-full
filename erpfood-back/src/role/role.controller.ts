import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { Role } from './entities/role.entity';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';

type RequestWithAuth = Request & { user?: JwtPayload };

@Controller('role')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Permissions('role.create')
  @ApiOkResponse({ type: Role })
  create(@Body() createRoleDto: CreateRoleDto, @Req() req: RequestWithAuth) {
    return this.roleService.create(createRoleDto, this.resolveTenantId(req));
  }

  @Get()
  @Permissions('role.read')
  @ApiOkResponse({ type: Role, isArray: true })
  findAll(@Req() req: RequestWithAuth) {
    return this.roleService.findAll(this.resolveTenantId(req));
  }

  @Get(':id')
  @Permissions('role.read')
  @ApiOkResponse({ type: Role })
  findOne(@Param('id') id: string, @Req() req: RequestWithAuth) {
    return this.roleService.findOne(+id, this.resolveTenantId(req));
  }

  @ApiBody({ type: CreateRoleDto })
  @Patch(':id')
  @Permissions('role.update')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto, @Req() req: RequestWithAuth) {
    return this.roleService.update(+id, updateRoleDto, this.resolveTenantId(req));
  }

  @Delete(':id')
  @Permissions('role.delete')
  remove(@Param('id') id: string, @Req() req: RequestWithAuth) {
    return this.roleService.remove(+id, this.resolveTenantId(req));
  }

  private resolveTenantId(req: RequestWithAuth) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant nao resolvido para operacao de papeis');
    }

    return tenantId;
  }
}
