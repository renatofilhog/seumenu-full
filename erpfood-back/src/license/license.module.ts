import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { License } from './entities/license.entity';
import { LicenseAccessGuard } from './license-access.guard';
import { LicenseExpirationService } from './license-expiration.service';

@Module({
  imports: [TypeOrmModule.forFeature([License])],
  providers: [LicenseAccessGuard, LicenseExpirationService],
  exports: [LicenseAccessGuard],
})
export class LicenseModule {}
