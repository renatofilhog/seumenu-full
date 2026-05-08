import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { License } from './entities/license.entity';

@Injectable()
export class LicenseExpirationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LicenseExpirationService.name);
  private intervalRef?: NodeJS.Timeout;

  constructor(
    @InjectRepository(License)
    private readonly licenseRepository: Repository<License>,
  ) {}

  onModuleInit() {
    const intervalMs = Number(process.env.LICENSE_EXPIRATION_CHECK_INTERVAL_MS ?? 300000);

    // Keep license status coherent even without incoming requests.
    this.intervalRef = setInterval(() => {
      void this.expireInvalidLicenses();
    }, intervalMs);

    this.logger.log(JSON.stringify({
      event: 'license.expiration.job.started',
      intervalMs,
      timestamp: new Date().toISOString(),
    }));
  }

  onModuleDestroy() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
    }
  }

  async expireInvalidLicenses() {
    const now = new Date();
    try {
      const result = await this.licenseRepository
        .createQueryBuilder()
        .update(License)
        .set({
          status: 'expired',
          lastCheckedAt: now,
          atualizadoEm: now,
        })
        .where('status IN (:...statuses)', { statuses: ['active', 'trial'] })
        .andWhere('expires_at < :now', { now: now.toISOString() })
        .andWhere('(grace_until IS NULL OR grace_until < :now)', { now: now.toISOString() })
        .execute();

      this.logger.log(JSON.stringify({
        event: 'license.expiration.job.finished',
        affected: result.affected ?? 0,
        timestamp: now.toISOString(),
      }));
    } catch (error) {
      this.logger.error(JSON.stringify({
        event: 'license.expiration.job.failed',
        message: error instanceof Error ? error.message : 'unknown error',
        timestamp: now.toISOString(),
      }));
    }
  }
}
