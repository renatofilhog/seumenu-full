import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { SaasManagementGuard } from 'src/auth/guards/saas-management.guard';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { ChangeCurrentPasswordDto } from './dto/change-current-password.dto';
import { UpdateSaasManagementUserDto } from './dto/update-saas-management-user.dto';
import { SaasManagementService } from './saas-management.service';

type RequestWithAuth = Request & {
  user?: JwtPayload;
  requestId?: string;
};

@ApiTags('SaaS Management')
@Controller('saas-management')
@UseGuards(JwtAuthGuard, SaasManagementGuard, PermissionsGuard)
export class SaasManagementController {
  constructor(private readonly saasManagementService: SaasManagementService) {}

  @Get('users')
  @ApiOkResponse()
  @Permissions('saas.users.read')
  findUsers() {
    return this.saasManagementService.findUsers();
  }

  @Get('roles')
  @ApiOkResponse()
  @Permissions('saas.users.read')
  findRoles() {
    return this.saasManagementService.findRoles();
  }

  @Patch('users/:id')
  @ApiOkResponse()
  @Permissions('saas.users.write')
  updateUser(@Param('id') id: string, @Body() dto: UpdateSaasManagementUserDto, @Req() req: RequestWithAuth) {
    return this.saasManagementService.updateUser(+id, dto, this.getAuditContext(req));
  }

  @Patch('users/me/password')
  @ApiOkResponse()
  changeCurrentPassword(@Body() dto: ChangeCurrentPasswordDto, @Req() req: RequestWithAuth) {
    return this.saasManagementService.changeCurrentPassword(
      Number(req.user?.sub),
      dto,
      this.getAuditContext(req),
    );
  }

  private getAuditContext(req: RequestWithAuth) {
    return {
      actorUserId: req.user?.sub,
      requestId: req.requestId,
    };
  }
}
