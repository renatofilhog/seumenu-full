import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { SaasManagementGuard } from 'src/auth/guards/saas-management.guard';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { CreateLicenseDto } from './dto/create-license.dto';
import { CreateLicensePlanDto } from './dto/create-license-plan.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { UpdateLicensePlanDto } from './dto/update-license-plan.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantUserDto } from './dto/update-tenant-user.dto';
import { ProvisionTenantAssistedDto } from './dto/provision-tenant-assisted.dto';
import { ProvisionTenantDto } from './dto/provision-tenant.dto';
import { RenewLicenseDto } from './dto/renew-license.dto';
import { RenewTenantLicenseDto } from './dto/renew-tenant-license.dto';
import { TenantAdminService } from './tenant-admin.service';

type RequestWithAuth = Request & {
  user?: JwtPayload;
  requestId?: string;
};

@ApiTags('Tenant Admin')
@Controller('tenant-admin')
@UseGuards(JwtAuthGuard, SaasManagementGuard, PermissionsGuard)
export class TenantAdminController {
  constructor(private readonly tenantAdminService: TenantAdminService) {}

  @Post('tenants')
  @ApiOkResponse()
  @Permissions('saas.tenants.write')
  createTenant(@Body() dto: CreateTenantDto, @Req() req: RequestWithAuth) {
    return this.tenantAdminService.createTenant(dto, this.getAuditContext(req));
  }

  @Get('tenants')
  @ApiOkResponse()
  @Permissions('saas.tenants.read')
  findAllTenants() {
    return this.tenantAdminService.findAllTenants();
  }

  @Get('summary')
  @ApiOkResponse()
  @Permissions('saas.tenants.read', 'saas.licenses.read')
  getSaasSummary(@Req() req: RequestWithAuth) {
    this.ensureSaasSuperAdmin(req);
    return this.tenantAdminService.getSaasSummary();
  }

  @Get('tenants/slug/:slug/availability')
  @ApiOkResponse()
  @Permissions('saas.tenants.read')
  checkTenantSlugAvailability(@Param('slug') slug: string) {
    return this.tenantAdminService.checkTenantSlugAvailability(slug);
  }

  @Patch('tenants/:id')
  @ApiOkResponse()
  @Permissions('saas.tenants.write')
  updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto, @Req() req: RequestWithAuth) {
    return this.tenantAdminService.updateTenant(+id, dto, this.getAuditContext(req));
  }

  @Delete('tenants/:id')
  @ApiOkResponse()
  @Permissions('saas.tenants.write')
  removeTenant(@Param('id') id: string, @Req() req: RequestWithAuth) {
    return this.tenantAdminService.removeTenant(+id, this.getAuditContext(req));
  }

  @Get('tenants/:tenantId/licenses')
  @ApiOkResponse()
  @Permissions('saas.licenses.read')
  findTenantLicenses(@Param('tenantId') tenantId: string) {
    return this.tenantAdminService.findTenantLicenses(+tenantId);
  }

  @Post('tenants/:tenantId/licenses')
  @ApiOkResponse()
  @Permissions('saas.licenses.write')
  createTenantLicense(@Param('tenantId') tenantId: string, @Body() dto: CreateLicenseDto, @Req() req: RequestWithAuth) {
    return this.tenantAdminService.createTenantLicense(+tenantId, dto, this.getAuditContext(req));
  }

  @Get('license-plans')
  @ApiOkResponse()
  @Permissions('saas.licenses.read')
  findActiveLicensePlans() {
    return this.tenantAdminService.findActiveLicensePlans();
  }

  @Get('license-plans/all')
  @ApiOkResponse()
  @Permissions('saas.licenses.read')
  findAllLicensePlans() {
    return this.tenantAdminService.findAllLicensePlans();
  }

  @Post('license-plans')
  @ApiOkResponse()
  @Permissions('saas.licenses.write')
  createLicensePlan(@Body() dto: CreateLicensePlanDto, @Req() req: RequestWithAuth) {
    return this.tenantAdminService.createLicensePlan(dto, this.getAuditContext(req));
  }

  @Patch('license-plans/:id')
  @ApiOkResponse()
  @Permissions('saas.licenses.write')
  updateLicensePlan(@Param('id') id: string, @Body() dto: UpdateLicensePlanDto, @Req() req: RequestWithAuth) {
    return this.tenantAdminService.updateLicensePlan(+id, dto, this.getAuditContext(req));
  }

  @Patch('licenses/:id')
  @ApiOkResponse()
  @Permissions('saas.licenses.write')
  updateLicense(@Param('id') id: string, @Body() dto: UpdateLicenseDto, @Req() req: RequestWithAuth) {
    return this.tenantAdminService.updateLicense(+id, dto, this.getAuditContext(req));
  }

  @Post('licenses/:id/renew')
  @ApiOkResponse()
  @Permissions('saas.licenses.write')
  renewLicense(@Param('id') id: string, @Body() dto: RenewLicenseDto, @Req() req: RequestWithAuth) {
    return this.tenantAdminService.renewLicense(+id, dto, this.getAuditContext(req));
  }

  @Post('tenants/:tenantId/license/renew')
  @ApiOkResponse()
  @Permissions('saas.licenses.write')
  renewTenantLicense(
    @Param('tenantId') tenantId: string,
    @Body() dto: RenewTenantLicenseDto,
    @Req() req: RequestWithAuth,
  ) {
    this.ensureSaasSuperAdmin(req);
    return this.tenantAdminService.renewTenantLicense(
      +tenantId,
      dto.licenseModelId,
      this.getAuditContext(req),
    );
  }

  @Get('tenants/:tenantId/users')
  @ApiOkResponse()
  @Permissions('saas.users.read')
  findTenantUsers(@Param('tenantId') tenantId: string) {
    return this.tenantAdminService.findTenantUsers(+tenantId);
  }

  @Get('users')
  @ApiOkResponse()
  @Permissions('saas.users.read')
  findAllTenantUsers(@Query('tenantId') tenantId?: string) {
    return this.tenantAdminService.findAllTenantUsers(tenantId ? +tenantId : undefined);
  }

  @Post('tenants/:tenantId/users')
  @ApiOkResponse()
  @Permissions('saas.users.write')
  createTenantUser(@Param('tenantId') tenantId: string, @Body() dto: CreateTenantUserDto, @Req() req: RequestWithAuth) {
    return this.tenantAdminService.createTenantUser(+tenantId, dto, this.getAuditContext(req));
  }

  @Patch('tenant-users/:id')
  @ApiOkResponse()
  @Permissions('saas.users.write')
  updateTenantUser(@Param('id') id: string, @Body() dto: UpdateTenantUserDto, @Req() req: RequestWithAuth) {
    return this.tenantAdminService.updateTenantUser(+id, dto, this.getAuditContext(req));
  }

  @Post('tenant-users/:id/reset-password')
  @ApiOkResponse()
  @Permissions('saas.users.write')
  resetTenantUserPassword(@Param('id') id: string, @Req() req: RequestWithAuth) {
    return this.tenantAdminService.resetTenantUserPassword(+id, this.getAuditContext(req));
  }

  @Post('provisioning')
  @ApiOkResponse()
  @Permissions('saas.provisioning.execute')
  provisionTenant(@Body() dto: ProvisionTenantDto, @Req() req: RequestWithAuth) {
    return this.tenantAdminService.provisionTenant(dto, this.getAuditContext(req));
  }

  @Post('provisioning/assisted')
  @ApiOkResponse()
  @Permissions('saas.provisioning.execute')
  provisionTenantAssisted(@Body() dto: ProvisionTenantAssistedDto, @Req() req: RequestWithAuth) {
    return this.tenantAdminService.provisionTenantAssisted(dto, this.getAuditContext(req));
  }

  private getAuditContext(req: RequestWithAuth) {
    return {
      actorUserId: req.user?.sub,
      requestId: req.requestId,
    };
  }

  private ensureSaasSuperAdmin(req: RequestWithAuth) {
    if (req.user?.principalType !== 'saas_management_user' || req.user?.role !== 'saas_super_admin') {
      throw new ForbiddenException('Apenas admin SaaS pode acessar este recurso');
    }
  }
}
