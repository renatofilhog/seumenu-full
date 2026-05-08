import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantAdminService } from './tenant-admin.service';

describe('TenantAdminService', () => {
  function createService(deps?: {
    tenantFindOne?: jest.Mock;
    transaction?: jest.Mock;
    provisionTenant?: jest.Mock;
    licenseFindOne?: jest.Mock;
    licenseSave?: jest.Mock;
    licensePlanFindOne?: jest.Mock;
    licensePlanSave?: jest.Mock;
    renewalSave?: jest.Mock;
    auditSave?: jest.Mock;
  }) {
    const tenantRepository = {
      findOne: deps?.tenantFindOne ?? jest.fn(),
    };

    const licenseRepository = {
      findOne: deps?.licenseFindOne ?? jest.fn(),
      save: deps?.licenseSave ?? jest.fn(),
    };

    const licensePlanRepository = {
      findOne: deps?.licensePlanFindOne ?? jest.fn(),
      save: deps?.licensePlanSave ?? jest.fn(async (value) => ({ id: 1, ...value })),
      create: jest.fn((value) => value),
    };

    const licenseRenewalHistoryRepository = {
      create: jest.fn((value) => value),
      save: deps?.renewalSave ?? jest.fn(),
    };

    const auditLogRepository = {
      create: jest.fn((value) => value),
      save: deps?.auditSave ?? jest.fn(),
    };

    const provisioningService = {
      provisionTenant: deps?.provisionTenant ?? jest.fn(),
    };
    const passwordService = {
      hash: jest.fn(async (value: string) => `hashed:${value}`),
    };

    const dataSource = {
      transaction: deps?.transaction
        ?? jest.fn(async (handler: (manager: unknown) => Promise<unknown>) => handler({})),
    };

    const service = new TenantAdminService(
      tenantRepository as any,
      licenseRepository as any,
      licensePlanRepository as any,
      licenseRenewalHistoryRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      auditLogRepository as any,
      provisioningService as any,
      dataSource as any,
      passwordService as any,
    );

    return {
      service,
      tenantRepository,
      licenseRepository,
      licensePlanRepository,
      licenseRenewalHistoryRepository,
      auditLogRepository,
      provisioningService,
      dataSource,
      passwordService,
    };
  }

  it('returns unavailable when slug already exists', async () => {
    const { service } = createService({
      tenantFindOne: jest.fn().mockResolvedValue({ id: 10, slug: 'cliente-a' }),
    });

    const result = await service.checkTenantSlugAvailability('CLIENTE-A');

    expect(result).toEqual({ slug: 'cliente-a', available: false });
  });

  it('throws when slug is empty', async () => {
    const { service } = createService();
    await expect(service.checkTenantSlugAvailability('   ')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates license plan with legacy durationMonths compatibility populated', async () => {
    const { service, licensePlanRepository } = createService({
      licensePlanFindOne: jest.fn().mockResolvedValue(null),
    });

    const result = await service.createLicensePlan({
      code: 'trial',
      nome: 'Trial',
      type: 'trial',
      defaultDurationDays: 30,
      ativo: true,
    });

    expect(licensePlanRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'trial',
        nome: 'Trial',
        type: 'trial',
        defaultDurationDays: 30,
        durationMonths: 1,
        ativo: true,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        code: 'trial',
        defaultDurationDays: 30,
        durationMonths: 1,
      }),
    );
  });

  it('provisions assisted flow using strict create mode', async () => {
    const provisionTenant = jest.fn().mockResolvedValue({ message: 'ok' });
    const transaction = jest.fn(async (handler: (manager: unknown) => Promise<unknown>) => handler({ marker: true }));
    const { service } = createService({
      provisionTenant,
      transaction,
    });

    const result = await service.provisionTenantAssisted({
      tenantName: 'Cliente ACME',
      tenantSlug: 'ACME-123',
      tenantActive: true,
      planCode: 'mensal',
      licenseStatus: 'active',
      domain: 'acme.com',
      subdomain: 'acme',
      externalRef: 'crm-99',
    });

    expect(result).toEqual({ message: 'ok' });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(provisionTenant).toHaveBeenCalledWith(
      { marker: true },
      expect.objectContaining({
        tenantName: 'Cliente ACME',
        tenantSlug: 'acme-123',
        planCode: 'mensal',
        licenseStatus: 'active',
      }),
      undefined,
      { mode: 'assisted', strictCreate: true },
    );
  });

  it('renews an active license adding days from current end date', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-26T12:00:00.000Z'));

    const currentLicense = {
      id: 55,
      status: 'active',
      startsAt: new Date('2026-02-01T00:00:00.000Z'),
      expiresAt: new Date('2026-03-10T00:00:00.000Z'),
      tenant: { id: 7 },
    };

    const licenseSave = jest.fn(async (value) => value);
    const { service, licenseRenewalHistoryRepository } = createService({
      licenseFindOne: jest.fn().mockResolvedValue(currentLicense),
      licenseSave,
    });

    const result = await service.renewLicense(55, { addedDays: 30 }, { actorUserId: 99 });

    expect(result.expiresAt.toISOString()).toBe('2026-04-09T00:00:00.000Z');
    expect(result.status).toBe('active');
    expect(licenseSave).toHaveBeenCalledTimes(1);
    expect(licenseRenewalHistoryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        addedDays: 30,
        renewedByUserId: 99,
      }),
    );

    jest.useRealTimers();
  });

  it('renews an expired license adding days from now and reactivates it', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-26T12:00:00.000Z'));

    const currentLicense = {
      id: 56,
      status: 'expired',
      startsAt: new Date('2025-12-01T00:00:00.000Z'),
      expiresAt: new Date('2026-01-10T00:00:00.000Z'),
      tenant: { id: 8 },
    };

    const licenseSave = jest.fn(async (value) => value);
    const { service } = createService({
      licenseFindOne: jest.fn().mockResolvedValue(currentLicense),
      licenseSave,
    });

    const result = await service.renewLicense(56, { addedDays: 15 });

    expect(result.expiresAt.toISOString()).toBe('2026-03-13T12:00:00.000Z');
    expect(result.status).toBe('active');

    jest.useRealTimers();
  });

  it('throws when renewing unknown license', async () => {
    const { service } = createService({
      licenseFindOne: jest.fn().mockResolvedValue(null),
    });

    await expect(service.renewLicense(999, { addedDays: 10 })).rejects.toBeInstanceOf(NotFoundException);
  });
});
