import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeCurrentPasswordDto } from './dto/change-current-password.dto';
import { ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { User } from './entities/user.entity';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';

type RequestWithAuth = Request & { user?: JwtPayload };

@Controller('user')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Permissions('user.create')
  @ApiOkResponse({ type: User })
  create(@Body() createUserDto: CreateUserDto, @Req() req: RequestWithAuth) {
    return this.userService.create(createUserDto, this.resolveTenantId(req));
  }

  @Get()
  @Permissions('user.read')
  @ApiOkResponse({ type: User, isArray: true })
  findAll(@Req() req: RequestWithAuth) {
    return this.userService.findAll(this.resolveTenantId(req));
  }

  @Get(':id')
  @Permissions('user.read')
  @ApiOkResponse({ type: User })
  findOne(@Param('id') id: string, @Req() req: RequestWithAuth) {
    return this.userService.findOne(+id, this.resolveTenantId(req));
  }

  @Patch(':id')
  @Permissions('user.update')
  @ApiBody({ type: CreateUserDto })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: RequestWithAuth) {
    return this.userService.update(+id, updateUserDto, this.resolveTenantId(req));
  }

  @Patch('me/password')
  @ApiOkResponse()
  changeCurrentPassword(@Body() dto: ChangeCurrentPasswordDto, @Req() req: RequestWithAuth) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Usuario autenticado nao encontrado');
    }

    return this.userService.changeCurrentPassword(userId, this.resolveTenantId(req), dto);
  }

  @Delete(':id')
  @Permissions('user.delete')
  remove(@Param('id') id: string, @Req() req: RequestWithAuth) {
    return this.userService.remove(+id, this.resolveTenantId(req));
  }

  private resolveTenantId(req: RequestWithAuth) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant nao resolvido para operacao de usuarios');
    }

    return tenantId;
  }
}
