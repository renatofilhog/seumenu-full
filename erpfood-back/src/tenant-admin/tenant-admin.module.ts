import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from 'src/audit/entities/audit-log.entity';
import { License } from 'src/license/entities/license.entity';
import { LicensePlan } from 'src/license/entities/license-plan.entity';
import { LicenseRenewalHistory } from 'src/license/entities/license-renewal-history.entity';
import { Permission } from 'src/permission/entities/permission.entity';
import { Role } from 'src/role/entities/role.entity';
import { TenantDomain } from 'src/tenant/entities/tenant-domain.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { TenantUser } from 'src/tenant/entities/tenant-user.entity';
import { User } from 'src/user/entities/user.entity';
import { ProvisioningService } from './provisioning.service';
import { TenantAdminController } from './tenant-admin.controller';
import { TenantAdminService } from './tenant-admin.service';
import { SecurityModule } from 'src/security/security.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, TenantDomain, License, LicensePlan, LicenseRenewalHistory, User, TenantUser, Role, Permission, AuditLog]), SecurityModule],
  controllers: [TenantAdminController],
  providers: [TenantAdminService, ProvisioningService],
})
export class TenantAdminModule {}
