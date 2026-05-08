import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from 'src/audit/entities/audit-log.entity';
import { SaasManagementController } from './saas-management.controller';
import { SaasManagementService } from './saas-management.service';
import { SaasManagementUser } from './entities/saas-management-user.entity';
import { SaasRole } from './entities/saas-role.entity';
import { SecurityModule } from 'src/security/security.module';

@Module({
  imports: [TypeOrmModule.forFeature([SaasManagementUser, SaasRole, AuditLog]), SecurityModule],
  controllers: [SaasManagementController],
  providers: [SaasManagementService],
})
export class SaasManagementModule {}
