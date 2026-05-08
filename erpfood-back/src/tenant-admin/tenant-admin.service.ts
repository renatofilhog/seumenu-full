import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Between, DataSource, In, Repository } from 'typeorm';
import { AuditLog } from 'src/audit/entities/audit-log.entity';
import { License } from 'src/license/entities/license.entity';
import { LicensePlan } from 'src/license/entities/license-plan.entity';
import { LicenseRenewalHistory } from 'src/license/entities/license-renewal-history.entity';
import { Role } from 'src/role/entities/role.entity';
import { TenantDomain } from 'src/tenant/entities/tenant-domain.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { TenantUser } from 'src/tenant/entities/tenant-user.entity';
import { User } from 'src/user/entities/user.entity';
import { PasswordService } from 'src/security/password.service';
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
import { ProvisioningService } from './provisioning.service';

type AuditContext = {
  actorUserId?: number;
  requestId?: string;
};

@Injectable()
export class TenantAdminService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(License)
    private readonly licenseRepository: Repository<License>,
    @InjectRepository(LicensePlan)
    private readonly licensePlanRepository: Repository<LicensePlan>,
    @InjectRepository(LicenseRenewalHistory)
    private readonly licenseRenewalHistoryRepository: Repository<LicenseRenewalHistory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TenantDomain)
    private readonly tenantDomainRepository: Repository<TenantDomain>,
    @InjectRepository(TenantUser)
    private readonly tenantUserRepository: Repository<TenantUser>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly provisioningService: ProvisioningService,
    private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
  ) {}

  async createTenant(dto: CreateTenantDto, context?: AuditContext) {
    const tenant = this.tenantRepository.create({
      ...dto,
      ativo: dto.ativo ?? true,
    });
    const saved = await this.tenantRepository.save(tenant);
    await this.writeAuditLog({
      action: 'tenant.create',
      entityType: 'tenant',
      entityId: String(saved.id),
      tenantId: saved.id,
      details: { nome: saved.nome, slug: saved.slug },
      context,
    });
    return saved;
  }

  findAllTenants() {
    return this.tenantRepository.find({
      order: { id: 'ASC' },
    }).then(async (tenants) => {
      if (!tenants.length) {
        return [];
      }

      const tenantIds = tenants.map((tenant) => tenant.id);
      const licenses = await this.licenseRepository.find({
        where: { tenant: { id: In(tenantIds) } },
        relations: { plan: true, tenant: true },
        order: { id: 'DESC' },
      });

      const latestByTenant = new Map<number, License>();
      for (const license of licenses) {
        const tenantId = license.tenant?.id;
        if (!tenantId || latestByTenant.has(tenantId)) {
          continue;
        }
        latestByTenant.set(tenantId, license);
      }

      return tenants.map((tenant) => {
        const license = latestByTenant.get(tenant.id);
        const daysRemaining = this.calculateDaysRemaining(license?.expiresAt);
        return {
          ...tenant,
          licenseModelId: license?.plan?.id ?? null,
          licenseModelName: license?.plan?.nome ?? license?.planType ?? null,
          validUntil: license?.expiresAt ?? null,
          daysRemaining,
        };
      });
    });
  }

  async getSaasSummary() {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [activeTenants, licensesExpiringThisMonth] = await Promise.all([
      this.tenantRepository.count({ where: { ativo: true } }),
      this.licenseRepository.count({
        where: {
          status: In(['active', 'trial']),
          expiresAt: Between(now, endOfMonth),
        },
      }),
    ]);

    return {
      activeTenants,
      licensesExpiringThisMonth,
      referenceDate: now.toISOString(),
      monthEndDate: endOfMonth.toISOString(),
    };
  }

  async checkTenantSlugAvailability(slug: string) {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) {
      throw new BadRequestException('Slug nao informado');
    }

    const existing = await this.tenantRepository.findOne({ where: { slug: normalizedSlug } });
    return {
      slug: normalizedSlug,
      available: !existing,
    };
  }

  async findActiveLicensePlans() {
    return this.licensePlanRepository.find({
      where: { ativo: true },
      order: { defaultDurationDays: 'ASC' },
    });
  }

  async findAllLicensePlans() {
    return this.licensePlanRepository.find({
      order: { defaultDurationDays: 'ASC', id: 'ASC' },
    });
  }

  async createLicensePlan(dto: CreateLicensePlanDto, context?: AuditContext) {
    const normalizedCode = this.normalizePlanCode(dto.code);
    const existingByCode = await this.licensePlanRepository.findOne({ where: { code: normalizedCode } });
    if (existingByCode) {
      throw new BadRequestException('Ja existe modelo de licenca com esse codigo');
    }

    const plan = this.licensePlanRepository.create({
      code: normalizedCode,
      nome: dto.nome.trim(),
      type: dto.type ?? 'subscription',
      defaultDurationDays: dto.defaultDurationDays,
      durationMonths: this.toLegacyDurationMonths(dto.defaultDurationDays),
      ativo: dto.ativo ?? true,
    });
    const saved = await this.licensePlanRepository.save(plan);

    await this.writeAuditLog({
      action: 'license_plan.create',
      entityType: 'license_plan',
      entityId: String(saved.id),
      details: {
        code: saved.code,
        nome: saved.nome,
        type: saved.type,
        defaultDurationDays: saved.defaultDurationDays,
        ativo: saved.ativo,
      },
      context,
    });

    return saved;
  }

  async updateLicensePlan(id: number, dto: UpdateLicensePlanDto, context?: AuditContext) {
    const plan = await this.licensePlanRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Modelo de licenca nao encontrado');
    }

    if (dto.code) {
      const normalizedCode = this.normalizePlanCode(dto.code);
      const duplicate = await this.licensePlanRepository.findOne({ where: { code: normalizedCode } });
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Ja existe modelo de licenca com esse codigo');
      }
      plan.code = normalizedCode;
    }

    if (dto.nome !== undefined) {
      plan.nome = dto.nome.trim();
    }
    if (dto.type !== undefined) {
      plan.type = dto.type;
    }
    if (dto.defaultDurationDays !== undefined) {
      plan.defaultDurationDays = dto.defaultDurationDays;
      plan.durationMonths = this.toLegacyDurationMonths(dto.defaultDurationDays);
    }
    if (dto.ativo !== undefined) {
      plan.ativo = dto.ativo;
    }

    const saved = await this.licensePlanRepository.save(plan);
    await this.writeAuditLog({
      action: 'license_plan.update',
      entityType: 'license_plan',
      entityId: String(saved.id),
      details: {
        code: saved.code,
        nome: saved.nome,
        type: saved.type,
        defaultDurationDays: saved.defaultDurationDays,
        ativo: saved.ativo,
      },
      context,
    });

    return saved;
  }

  async updateTenant(id: number, dto: UpdateTenantDto, context?: AuditContext) {
    await this.tenantRepository.update(id, dto);
    const tenant = await this.tenantRepository.findOneBy({ id });
    if (!tenant) {
      throw new NotFoundException('Tenant nao encontrado');
    }
    await this.writeAuditLog({
      action: 'tenant.update',
      entityType: 'tenant',
      entityId: String(tenant.id),
      tenantId: tenant.id,
      details: dto as Record<string, unknown>,
      context,
    });
    return tenant;
  }

  async removeTenant(id: number, context?: AuditContext) {
    const tenant = await this.tenantRepository.findOneBy({ id });
    if (!tenant) {
      throw new NotFoundException('Tenant nao encontrado');
    }

    await this.tenantRepository.update(id, { ativo: false });
    await this.writeAuditLog({
      action: 'tenant.deactivate',
      entityType: 'tenant',
      entityId: String(id),
      tenantId: id,
      details: { ativo: false },
      context,
    });
    return { message: 'Tenant inativado com sucesso' };
  }

  findTenantLicenses(tenantId: number) {
    return this.licenseRepository.find({
      where: { tenant: { id: tenantId } },
      order: { id: 'DESC' },
      relations: { tenant: true },
    });
  }

  async createTenantLicense(tenantId: number, dto: CreateLicenseDto, context?: AuditContext) {
    const tenant = await this.tenantRepository.findOneBy({ id: tenantId });
    if (!tenant) {
      throw new NotFoundException('Tenant nao encontrado');
    }

    const plan = await this.resolveLicensePlan(dto.planType);
    if (!plan) {
      throw new NotFoundException('Modelo de licenca nao encontrado');
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : new Date();
    const durationDays = dto.durationDays ?? plan.defaultDurationDays;
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : this.addDays(startsAt, durationDays);
    const graceUntil = dto.graceUntil ? new Date(dto.graceUntil) : undefined;

    if (startsAt >= expiresAt) {
      throw new BadRequestException('A data de inicio deve ser menor que a data de expiracao');
    }

    const license = this.licenseRepository.create({
      tenant,
      plan,
      planType: plan.code,
      status: dto.status ?? 'active',
      startsAt,
      expiresAt,
      graceUntil,
    });

    const saved = await this.licenseRepository.save(license);
    await this.writeAuditLog({
      action: 'license.create',
      entityType: 'license',
      entityId: String(saved.id),
      tenantId,
      details: {
        planType: saved.planType,
        status: saved.status,
        startsAt: saved.startsAt,
        expiresAt: saved.expiresAt,
        durationDays,
      },
      context,
    });
    return saved;
  }

  async renewLicense(id: number, dto: RenewLicenseDto, context?: AuditContext) {
    const license = await this.licenseRepository.findOne({
      where: { id },
      relations: { tenant: true },
    });
    if (!license) {
      throw new NotFoundException('Licenca nao encontrada');
    }

    const now = new Date();
    const previousEndDate = license.expiresAt;
    const baseDate = previousEndDate > now ? previousEndDate : now;
    const newEndDate = this.addDays(baseDate, dto.addedDays);

    license.expiresAt = newEndDate;
    license.lastCheckedAt = now;
    if (license.status === 'expired') {
      license.status = 'active';
    }
    const savedLicense = await this.licenseRepository.save(license);

    await this.licenseRenewalHistoryRepository.save(
      this.licenseRenewalHistoryRepository.create({
        tenantLicense: savedLicense,
        addedDays: dto.addedDays,
        previousEndDate,
        newEndDate,
        renewedByUserId: context?.actorUserId,
      }),
    );

    await this.writeAuditLog({
      action: 'license.renew',
      entityType: 'license',
      entityId: String(savedLicense.id),
      tenantId: savedLicense.tenant.id,
      details: {
        addedDays: dto.addedDays,
        previousEndDate,
        newEndDate,
      },
      context,
    });

    return savedLicense;
  }

  async updateLicense(id: number, dto: UpdateLicenseDto, context?: AuditContext) {
    const license = await this.licenseRepository.findOne({
      where: { id },
      relations: { tenant: true },
    });
    if (!license) {
      throw new NotFoundException('Licenca nao encontrada');
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : license.startsAt;
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : license.expiresAt;
    const plan = dto.planType ? await this.resolveLicensePlan(dto.planType) : license.plan;

    if (startsAt >= expiresAt) {
      throw new BadRequestException('A data de inicio deve ser menor que a data de expiracao');
    }

    const before = {
      status: license.status,
      planType: license.planType,
      startsAt: license.startsAt,
      expiresAt: license.expiresAt,
    };

    await this.licenseRepository.update(id, {
      plan: plan ?? undefined,
      planType: dto.planType ? (plan?.code ?? dto.planType) : license.planType,
      status: dto.status ?? license.status,
      startsAt,
      expiresAt,
      graceUntil: dto.graceUntil ? new Date(dto.graceUntil) : license.graceUntil,
    });

    const updated = await this.licenseRepository.findOne({
      where: { id },
      relations: { tenant: true },
    });
    if (updated) {
      await this.writeAuditLog({
        action: 'license.update',
        entityType: 'license',
        entityId: String(updated.id),
        tenantId: updated.tenant.id,
        details: {
          before,
          after: {
            status: updated.status,
            planType: updated.planType,
            startsAt: updated.startsAt,
            expiresAt: updated.expiresAt,
          },
        },
        context,
      });
    }
    return updated;
  }

  async renewTenantLicense(tenantId: number, licenseModelId: number, context?: AuditContext) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant nao encontrado');
    }

    const plan = await this.licensePlanRepository.findOne({ where: { id: licenseModelId, ativo: true } });
    if (!plan) {
      throw new NotFoundException('Modelo de licenca nao encontrado');
    }

    const now = new Date();
    const latestLicense = await this.licenseRepository.findOne({
      where: { tenant: { id: tenantId } },
      relations: { tenant: true, plan: true },
      order: { id: 'DESC' },
    });

    const previousEndDate = latestLicense?.expiresAt ?? now;
    const baseDate = latestLicense && latestLicense.expiresAt >= now ? latestLicense.expiresAt : now;
    const newEndDate = this.addDays(baseDate, plan.defaultDurationDays);

    let savedLicense: License;
    if (!latestLicense) {
      savedLicense = await this.licenseRepository.save(
        this.licenseRepository.create({
          tenant,
          plan,
          planType: plan.code,
          status: 'active',
          startsAt: now,
          expiresAt: newEndDate,
          lastCheckedAt: now,
        }),
      );
    } else {
      latestLicense.plan = plan;
      latestLicense.planType = plan.code;
      latestLicense.status = 'active';
      latestLicense.expiresAt = newEndDate;
      latestLicense.lastCheckedAt = now;
      if (latestLicense.startsAt > now || latestLicense.startsAt >= latestLicense.expiresAt) {
        latestLicense.startsAt = now;
      }
      savedLicense = await this.licenseRepository.save(latestLicense);
    }

    await this.licenseRenewalHistoryRepository.save(
      this.licenseRenewalHistoryRepository.create({
        tenantLicense: savedLicense,
        addedDays: plan.defaultDurationDays,
        previousEndDate,
        newEndDate,
        renewedByUserId: context?.actorUserId,
      }),
    );

    await this.writeAuditLog({
      action: 'license.renew.by_tenant',
      entityType: 'license',
      entityId: String(savedLicense.id),
      tenantId,
      details: {
        licenseModelId: plan.id,
        licenseModelCode: plan.code,
        licenseModelName: plan.nome,
        previousEndDate,
        newEndDate,
      },
      context,
    });

    return {
      tenantId,
      licenseId: savedLicense.id,
      licenseModelId: plan.id,
      licenseModelName: plan.nome,
      validUntil: savedLicense.expiresAt,
      daysRemaining: this.calculateDaysRemaining(savedLicense.expiresAt),
    };
  }

  async findTenantUsers(tenantId: number) {
    const rows = await this.tenantUserRepository.find({
      where: { tenant: { id: tenantId } },
      relations: {
        tenant: true,
        user: true,
        role: true,
      },
      order: { id: 'ASC' },
    });

    return rows.map((row) => this.mapTenantUserRow(row));
  }

  async findAllTenantUsers(tenantId?: number) {
    const rows = await this.tenantUserRepository.find({
      where: tenantId ? { tenant: { id: tenantId } } : undefined,
      relations: {
        tenant: true,
        user: true,
        role: true,
      },
      order: {
        tenant: { nome: 'ASC' },
        id: 'ASC',
      },
    });

    return rows.map((row) => this.mapTenantUserRow(row));
  }

  async createTenantUser(tenantId: number, dto: CreateTenantUserDto, context?: AuditContext) {
    const tenant = await this.tenantRepository.findOneBy({ id: tenantId });
    if (!tenant) {
      throw new NotFoundException('Tenant nao encontrado');
    }

    let role: Role | null = null;
    if (dto.roleId) {
      role = await this.roleRepository.findOneBy({ id: dto.roleId });
      if (!role) {
        throw new NotFoundException('Role nao encontrada');
      }
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
      relations: { role: true },
    });

    if (existingUser?.tenantId && existingUser.tenantId !== tenantId) {
      throw new BadRequestException('Usuario da aplicacao ja vinculado a outro tenant');
    }

    const user = existingUser
      ?? this.userRepository.create({
        nome: dto.nome,
        email: dto.email,
        senha: await this.passwordService.hash(dto.senha ?? 'changeme'),
        tenantId,
        role: role ?? undefined,
      });

    if (existingUser) {
      existingUser.nome = dto.nome;
      existingUser.tenantId = tenantId;
      if (role) {
        existingUser.role = role;
      }
      if (dto.senha !== undefined && dto.senha !== '') {
        existingUser.senha = await this.passwordService.hash(dto.senha);
      }
      await this.userRepository.save(existingUser);
    } else {
      await this.userRepository.save(user);
    }

    const persistedUser = existingUser ?? user;

    const existingMembership = await this.tenantUserRepository.findOne({
      where: {
        tenant: { id: tenantId },
        user: { id: persistedUser.id },
      },
      relations: {
        tenant: true,
        user: true,
      },
    });

    const foreignMembership = await this.tenantUserRepository.findOne({
      where: {
        user: { id: persistedUser.id },
      },
      relations: {
        tenant: true,
      },
      order: { id: 'ASC' },
    });

    if (foreignMembership && foreignMembership.tenant.id !== tenantId) {
      throw new BadRequestException('Usuario da aplicacao deve permanecer associado a um unico tenant');
    }

    if (existingMembership) {
      existingMembership.ativo = dto.ativo ?? existingMembership.ativo;
      if (role) {
        existingMembership.role = role;
      }
      const saved = await this.tenantUserRepository.save(existingMembership);
      await this.writeAuditLog({
        action: 'tenant_user.update',
        entityType: 'tenant_user',
        entityId: String(saved.id),
        tenantId,
        details: { userId: persistedUser.id, roleId: saved.role?.id, ativo: saved.ativo },
        context,
      });
      return saved;
    }

    const tenantUser = this.tenantUserRepository.create({
      tenant,
      user: persistedUser,
      role: role ?? undefined,
      ativo: dto.ativo ?? true,
    });

    const savedTenantUser = await this.tenantUserRepository.save(tenantUser);
    await this.writeAuditLog({
      action: 'tenant_user.create',
      entityType: 'tenant_user',
      entityId: String(savedTenantUser.id),
      tenantId,
      details: { userId: persistedUser.id, roleId: savedTenantUser.role?.id, ativo: savedTenantUser.ativo },
      context,
    });
    return savedTenantUser;
  }

  async updateTenantUser(id: number, dto: UpdateTenantUserDto, context?: AuditContext) {
    const tenantUser = await this.tenantUserRepository.findOne({
      where: { id },
      relations: { user: true, role: true, tenant: true },
    });
    if (!tenantUser) {
      throw new NotFoundException('Vinculo tenant-usuario nao encontrado');
    }

    if (dto.nome !== undefined) {
      tenantUser.user.nome = dto.nome.trim();
    }

    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const duplicatedUser = await this.userRepository.findOne({ where: { email: normalizedEmail } });
      if (duplicatedUser && duplicatedUser.id !== tenantUser.user.id) {
        throw new BadRequestException('Ja existe usuario com este e-mail');
      }
      tenantUser.user.email = normalizedEmail;
    }

    if (dto.roleId) {
      const role = await this.roleRepository.findOneBy({ id: dto.roleId });
      if (!role) {
        throw new NotFoundException('Role nao encontrada');
      }
      tenantUser.role = role;
      tenantUser.user.role = role;
    }

    await this.userRepository.save(tenantUser.user);

    if (dto.ativo !== undefined) {
      tenantUser.ativo = dto.ativo;
    }

    const saved = await this.tenantUserRepository.save(tenantUser);
    await this.writeAuditLog({
      action: 'tenant_user.update',
      entityType: 'tenant_user',
      entityId: String(saved.id),
      tenantId: saved.tenant.id,
      details: {
        userId: saved.user.id,
        nome: saved.user.nome,
        email: saved.user.email,
        roleId: saved.role?.id,
        ativo: saved.ativo,
      },
      context,
    });
    return this.mapTenantUserRow(saved);
  }

  async resetTenantUserPassword(id: number, context?: AuditContext) {
    const tenantUser = await this.tenantUserRepository.findOne({
      where: { id },
      relations: { user: true, tenant: true },
    });
    if (!tenantUser) {
      throw new NotFoundException('Vinculo tenant-usuario nao encontrado');
    }

    const tempPassword = this.generateTemporaryPassword();
    tenantUser.user.senha = await this.passwordService.hash(tempPassword);
    tenantUser.user.forcePasswordChange = true;
    await this.userRepository.save(tenantUser.user);

    await this.writeAuditLog({
      action: 'tenant_user.password_reset',
      entityType: 'tenant_user',
      entityId: String(tenantUser.id),
      tenantId: tenantUser.tenant.id,
      details: {
        userId: tenantUser.user.id,
        forcePasswordChange: true,
      },
      context,
    });

    return {
      tenantUserId: tenantUser.id,
      userId: tenantUser.user.id,
      tempPassword,
      forcePasswordChange: true,
    };
  }

  async provisionTenant(dto: ProvisionTenantDto, context?: AuditContext) {
    return this.dataSource.transaction((manager) => this.provisioningService.provisionTenant(manager, dto, context, { mode: 'standard' }));
  }

  async provisionTenantAssisted(dto: ProvisionTenantAssistedDto, context?: AuditContext) {
    if (dto.initialUsers && dto.initialUsers.length > 4) {
      throw new BadRequestException('O fluxo assistido permite no maximo 4 usuarios iniciais');
    }

    return this.dataSource.transaction((manager) =>
      this.provisioningService.provisionTenant(
        manager,
        {
          tenantName: dto.tenantName,
          tenantSlug: dto.tenantSlug.trim().toLowerCase(),
          tenantActive: dto.tenantActive ?? true,
          domain: dto.domain,
          subdomain: dto.subdomain,
          planCode: dto.planCode,
          licenseStatus: dto.licenseStatus ?? 'active',
          startsAt: dto.startsAt,
          expiresAt: dto.expiresAt,
          durationDays: dto.durationDays,
          externalRef: dto.externalRef,
          store: dto.store,
          initialUsers: dto.initialUsers,
        },
        context,
        { mode: 'assisted', strictCreate: true },
      ),
    );
  }

  private async writeAuditLog(params: {
    action: string;
    entityType: string;
    entityId?: string;
    tenantId?: number;
    details?: Record<string, unknown>;
    context?: AuditContext;
  }) {
    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        tenantId: params.tenantId,
        details: params.details,
        actorUserId: params.context?.actorUserId,
        requestId: params.context?.requestId,
      }),
    );
  }

  private mapTenantUserRow(row: TenantUser) {
    return {
      id: row.id,
      ativo: row.ativo,
      tenantId: row.tenant.id,
      tenant: {
        id: row.tenant.id,
        nome: row.tenant.nome,
        slug: row.tenant.slug,
      },
      role: row.role ? { id: row.role.id, nome: row.role.nome } : null,
      user: {
        id: row.user.id,
        nome: row.user.nome,
        email: row.user.email,
        tenantId: row.user.tenantId,
        forcePasswordChange: Boolean(row.user.forcePasswordChange),
      },
    };
  }

  private generateTemporaryPassword() {
    return `tmp-${randomBytes(4).toString('hex')}`;
  }

  private async resolveLicensePlan(planType?: string) {
    if (!planType) {
      return null;
    }

    const normalized = this.normalizePlanCode(planType);
    return this.licensePlanRepository.findOne({
      where: [{ code: normalized, ativo: true }, { code: planType, ativo: true }],
    });
  }

  private normalizePlanCode(value: string) {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

    const aliases: Record<string, string> = {
      mensal: 'mensal',
      monthly: 'mensal',
      basic: 'mensal',
      trimestral: 'trimestral',
      quarterly: 'trimestral',
      semestral: 'semestral',
      biannual: 'semestral',
      anual: 'anual',
      annual: 'anual',
    };

    return aliases[normalized] ?? normalized;
  }

  private toLegacyDurationMonths(defaultDurationDays: number) {
    return Math.max(1, Math.ceil(defaultDurationDays / 30));
  }

  private addDays(baseDate: Date, days: number) {
    const next = new Date(baseDate);
    next.setDate(next.getDate() + days);
    return next;
  }

  private calculateDaysRemaining(validUntil?: Date | null) {
    if (!validUntil) {
      return null;
    }
    const now = new Date();
    const diffMs = validUntil.getTime() - now.getTime();
    if (diffMs <= 0) {
      return 0;
    }
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
}
