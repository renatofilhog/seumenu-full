import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { Permission } from './entities/permission.entity';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@Controller('permission')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @Permissions('permission.create')
  @ApiOkResponse({ type: Permission })
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Get()
  @Permissions('permission.read')
  @ApiOkResponse({ type: Permission, isArray: true })
  findAll() {
    return this.permissionService.findAll();
  }

  @Get(':id')
  @Permissions('permission.read')
  @ApiOkResponse({ type: Permission })
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(+id);
  }


  @ApiBody({ type: CreatePermissionDto })
  @Patch(':id')
  @Permissions('permission.update')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionService.update(+id, updatePermissionDto);
  }

  @Delete(':id')
  @Permissions('permission.delete')
  remove(@Param('id') id: string) {
    return this.permissionService.remove(+id);
  }
}
