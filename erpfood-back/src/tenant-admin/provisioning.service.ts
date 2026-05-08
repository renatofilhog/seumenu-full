import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from 'src/audit/entities/audit-log.entity';
import { License } from 'src/license/entities/license.entity';
import { LicensePlan } from 'src/license/entities/license-plan.entity';
import { Permission } from 'src/permission/entities/permission.entity';
import { Role } from 'src/role/entities/role.entity';
import { Store } from 'src/store/entities/store.entity';
import { TenantDomain } from 'src/tenant/entities/tenant-domain.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { TenantUser } from 'src/tenant/entities/tenant-user.entity';
import { User } from 'src/user/entities/user.entity';
import { PasswordService } from 'src/security/password.service';
import { ProvisionTenantDto } from './dto/provision-tenant.dto';

type AuditContext = {
  actorUserId?: number;
  requestId?: string;
};

type ProvisioningOptions = {
  mode?: 'standard' | 'assisted';
  strictCreate?: boolean;
};

@Injectable()
export class ProvisioningService {
  constructor(private readonly passwordService: PasswordService) {}

  async provisionTenant(manager: EntityManager, dto: ProvisionTenantDto, context?: AuditContext, options?: ProvisioningOptions) {
    const tenantRepo = manager.getRepository(Tenant);
    const tenantDomainRepo = manager.getRepository(TenantDomain);
    const userRepo = manager.getRepository(User);
    const roleRepo = manager.getRepository(Role);
    const permissionRepo = manager.getRepository(Permission);
    const tenantUserRepo = manager.getRepository(TenantUser);
    const licenseRepo = manager.getRepository(License);
    const licensePlanRepo = manager.getRepository(LicensePlan);
    const storeRepo = manager.getRepository(Store);

    let tenant = await tenantRepo.findOne({
      where: [{ slug: dto.tenantSlug }, ...(dto.externalRef ? [{ nome: dto.tenantName }] : [])],
    });

    if (tenant && options?.strictCreate) {
      throw new BadRequestException('Slug do tenant ja cadastrado');
    }

    if (!tenant) {
      tenant = tenantRepo.create({
        nome: dto.tenantName,
        slug: dto.tenantSlug,
        dominio: dto.domain ?? undefined,
        subdominio: dto.subdomain ?? undefined,
        ativo: dto.tenantActive ?? true,
      });
      tenant = await tenantRepo.save(tenant);
    } else if (dto.tenantActive !== undefined && tenant.ativo !== dto.tenantActive) {
      tenant.ativo = dto.tenantActive;
      tenant = await tenantRepo.save(tenant);
    }

    const whereDomains = [
      ...(dto.domain ? [{ domain: dto.domain }] : []),
      ...(dto.subdomain ? [{ subdomain: dto.subdomain }] : []),
    ];

    const existingDomain = whereDomains.length
      ? await tenantDomainRepo.findOne({
          where: whereDomains,
          relations: { tenant: true },
        })
      : null;

    if (existingDomain && existingDomain.tenant.id !== tenant.id) {
      throw new BadRequestException('Dominio/subdominio ja associado a outro tenant');
    }

    if (dto.domain || dto.subdomain) {
      const tenantDomain = await tenantDomainRepo.findOne({
        where: {
          tenant: { id: tenant.id },
          domain: dto.domain ?? undefined,
          subdomain: dto.subdomain ?? undefined,
        },
        relations: { tenant: true },
      });

      if (!tenantDomain) {
        await tenantDomainRepo.save(
          tenantDomainRepo.create({
            tenant,
            domain: dto.domain,
            subdomain: dto.subdomain,
            isPrimary: true,
          }),
        );
      }
    }

    const defaultRoles = await this.ensureDefaultRoles(roleRepo, permissionRepo);
    const adminEmail = dto.adminEmail ?? `admin@${tenant.slug}.seumenu`;
    const cozinhaEmail = `cozinha@${tenant.slug}.seumenu`;
    const atendimentoEmail = `atendimento@${tenant.slug}.seumenu`;

    const providedUsers = dto.initialUsers?.length
      ? dto.initialUsers
      : [
          { nome: dto.adminName ?? 'Admin', email: adminEmail, roleKey: 'admin' as const, permissions: undefined },
          { nome: 'Cozinha', email: cozinhaEmail, roleKey: 'cozinha' as const, permissions: undefined },
          { nome: 'Atendimento', email: atendimentoEmail, roleKey: 'atendimento' as const, permissions: undefined },
        ];

    if (providedUsers.length > 4) {
      throw new BadRequestException('O provisionamento permite no maximo 4 usuarios iniciais');
    }
    if (providedUsers.length < 1) {
      throw new BadRequestException('Informe ao menos um usuario inicial');
    }

    const provisionedUsers: Array<{ id: number; nome: string; email: string; role: string; tempPassword: string; forcePasswordChange: boolean }> = [];

    for (const initialUser of providedUsers) {
      const generatedPassword = this.generateRandomPassword();
      const forcePasswordChange = options?.mode === 'assisted';
      const resolvedRole = await this.resolveInitialUserRole({
        tenant,
        roleRepo,
        permissionRepo,
        defaultRoles,
        roleKey: initialUser.roleKey,
        permissions: initialUser.permissions,
        userEmail: initialUser.email,
      });

      let user = await userRepo.findOne({
        where: { email: initialUser.email },
        relations: { role: true },
      });
      const hashedPassword = await this.passwordService.hash(generatedPassword);

      if (user?.tenantId && user.tenantId !== tenant.id) {
        throw new BadRequestException(`Usuario ${initialUser.email} ja vinculado a outro tenant`);
      }

      if (!user) {
        user = userRepo.create({
          nome: initialUser.nome,
          email: initialUser.email,
          senha: hashedPassword,
          forcePasswordChange,
          tenantId: tenant.id,
          role: resolvedRole,
        });
      } else {
        user.nome = initialUser.nome;
        user.tenantId = tenant.id;
        user.role = resolvedRole;
        user.senha = hashedPassword;
        user.forcePasswordChange = forcePasswordChange;
      }
      user = await userRepo.save(user);

      const existingMembership = await tenantUserRepo.findOne({
        where: { tenant: { id: tenant.id }, user: { id: user.id } },
        relations: { tenant: true, user: true, role: true },
      });

      const anyMembership = await tenantUserRepo.findOne({
        where: { user: { id: user.id } },
        relations: { tenant: true, user: true },
      });

      if (anyMembership && anyMembership.tenant.id !== tenant.id) {
        throw new BadRequestException(`Usuario ${initialUser.email} deve permanecer associado a um unico tenant`);
      }

      if (existingMembership) {
        existingMembership.ativo = true;
        existingMembership.role = resolvedRole;
        await tenantUserRepo.save(existingMembership);
      } else {
        await tenantUserRepo.save(
          tenantUserRepo.create({
            tenant,
            user,
            role: resolvedRole,
            ativo: true,
          }),
        );
      }

      provisionedUsers.push({
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: resolvedRole.nome,
        tempPassword: generatedPassword,
        forcePasswordChange,
      });
    }

    const selectedPlanCode = this.normalizePlanCode(dto.planCode ?? dto.planType);
    const planCode = selectedPlanCode ?? 'mensal';
    const plan = await licensePlanRepo.findOne({
      where: { code: planCode, ativo: true },
    });

    if (!plan) {
      throw new BadRequestException(`Plano de licenca padrao nao encontrado para codigo ${planCode}`);
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : new Date();
    const durationDays = dto.durationDays ?? plan.defaultDurationDays;
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : this.addDays(startsAt, durationDays);
    if (startsAt >= expiresAt) {
      throw new BadRequestException('A data de inicio deve ser menor que a data de expiracao');
    }

    const currentLicense = await licenseRepo.findOne({
      where: { tenant: { id: tenant.id } },
      order: { id: 'DESC' },
      relations: { tenant: true, plan: true },
    });

    let license: License;
    if (!currentLicense) {
      license = await licenseRepo.save(
        licenseRepo.create({
          tenant,
          plan,
          planType: plan.code,
          status: dto.licenseStatus ?? 'active',
          startsAt,
          expiresAt,
          graceUntil: dto.graceUntil ? new Date(dto.graceUntil) : undefined,
        }),
      );
    } else {
      currentLicense.plan = plan;
      currentLicense.planType = plan.code;
      currentLicense.status = dto.licenseStatus ?? currentLicense.status;
      currentLicense.startsAt = startsAt;
      currentLicense.expiresAt = expiresAt;
      currentLicense.graceUntil = dto.graceUntil ? new Date(dto.graceUntil) : currentLicense.graceUntil;
      license = await licenseRepo.save(currentLicense);
    }

    const domains = await tenantDomainRepo.find({
      where: { tenant: { id: tenant.id } },
      relations: { tenant: true },
    });

    const summary = {
      message: 'Provisionamento concluido',
      flowMode: options?.mode ?? 'standard',
      tenant: {
        id: tenant.id,
        nome: tenant.nome,
        slug: tenant.slug,
        ativo: tenant.ativo,
      },
      defaultUsers: provisionedUsers,
      license: {
        id: license.id,
        planType: license.planType,
        status: license.status,
        startsAt: license.startsAt,
        expiresAt: license.expiresAt,
        durationDays,
      },
      tenantDomains: domains.map((domain) => ({
        id: domain.id,
        domain: domain.domain,
        subdomain: domain.subdomain,
        isPrimary: domain.isPrimary,
      })),
      store: null as null | {
        id: number;
        nome: string;
        localizacao: string;
      },
    };

    if (this.hasStoreData(dto.store)) {
      const currentStore = await storeRepo.findOne({
        where: { tenantId: tenant.id },
        order: { id: 'DESC' },
      });

      const storePayload = {
        nome: dto.store?.nome?.trim() || tenant.nome,
        cnpj: dto.store?.cnpj?.trim() || undefined,
        resumo: dto.store?.resumo?.trim() || `Loja principal do tenant ${tenant.nome}`,
        bannerUrl: dto.store?.bannerUrl?.trim() || '',
        logoUrl: dto.store?.logoUrl?.trim() || '',
        horarioFuncionamento: dto.store?.horarioFuncionamento?.trim() || 'Nao informado',
        localizacao: dto.store?.localizacao?.trim() || 'Nao informada',
        corFundo: dto.store?.corFundo?.trim() || '#ffffff',
        habilitaVerificacaoMesa: dto.store?.habilitaVerificacaoMesa ?? false,
      };

      const persistedStore = currentStore
        ? await storeRepo.save({
            ...currentStore,
            ...storePayload,
            ativo: true,
            tenantId: tenant.id,
          })
        : await storeRepo.save(
            storeRepo.create({
              ...storePayload,
              tenantId: tenant.id,
              ativo: true,
            }),
          );

      summary.store = {
        id: persistedStore.id,
        nome: persistedStore.nome,
        localizacao: persistedStore.localizacao,
      };
    }

    await manager.getRepository(AuditLog).save(
      manager.getRepository(AuditLog).create({
        action: 'tenant.provision',
        entityType: 'tenant',
        entityId: String(tenant.id),
        tenantId: tenant.id,
        actorUserId: context?.actorUserId,
        requestId: context?.requestId,
        details: {
          mode: options?.mode ?? 'standard',
          tenantSlug: tenant.slug,
          defaultUsers: provisionedUsers,
          planType: license.planType,
          licenseStatus: license.status,
          domains: summary.tenantDomains,
          storeId: summary.store?.id,
        },
      }),
    );

    return summary;
  }

  private async ensureDefaultRoles(roleRepo: Repository<Role>, permissionRepo: Repository<Permission>) {
    await this.alignSequenceToMaxId(roleRepo, 'roles');

    const allPermission = await permissionRepo.findOne({ where: { nome: 'all' } });
    if (!allPermission) {
      throw new BadRequestException('Permissao global "all" nao encontrada');
    }

    const defaultRoleConfigs = [
      {
        key: 'admin',
        nome: 'Admin',
        descricao: 'Perfil administrador padrao de provisionamento',
        permissionNames: ['all'],
      },
      {
        key: 'cozinha',
        nome: 'Cozinha',
        descricao: 'Perfil padrao de cozinha',
        permissionNames: ['pedido.read', 'pedido.update', 'pedido-item.read', 'pedido-status.read', 'pedido-status.update'],
      },
      {
        key: 'atendimento',
        nome: 'Atendimento',
        descricao: 'Perfil padrao de atendimento',
        permissionNames: ['mesa.read', 'mesa.update', 'pedido.read', 'pedido.create', 'pedido.update', 'pedido-item.read'],
      },
    ] as const;

    const roles: Record<string, Role> = {};

    for (const config of defaultRoleConfigs) {
      const permissions = await permissionRepo.find({
        where: config.permissionNames.map((name) => ({ nome: name })),
      });
      if (!permissions.length) {
        throw new BadRequestException(`Permissoes nao encontradas para role ${config.nome}`);
      }

      let role = await roleRepo.findOne({
        where: { nome: config.nome },
        relations: { permissions: true },
      });

      if (!role) {
        role = roleRepo.create({
          nome: config.nome,
          descricao: config.descricao,
          permissions,
        });
      } else {
        role.descricao = config.descricao;
        role.permissions = permissions;
      }

      role = await roleRepo.save(role);
      roles[config.key] = role;
    }

    return roles as { admin: Role; cozinha: Role; atendimento: Role };
  }

  private async alignSequenceToMaxId(repository: Repository<any>, tableName: string) {
    await repository.query(
      `SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), COALESCE((SELECT MAX(id) FROM "${tableName}"), 0) + 1, false)`,
    );
  }

  private async resolveInitialUserRole(params: {
    tenant: Tenant;
    roleRepo: Repository<Role>;
    permissionRepo: Repository<Permission>;
    defaultRoles: { admin: Role; cozinha: Role; atendimento: Role };
    roleKey?: 'admin' | 'cozinha' | 'atendimento';
    permissions?: string[];
    userEmail: string;
  }) {
    const roleKey = params.roleKey ?? 'atendimento';
    const permissions = params.permissions?.map((permission) => permission.trim()).filter(Boolean) ?? [];
    const roleName = `${params.tenant.slug}.${roleKey}.seumenu`;
    const resolvedPermissions = permissions.length
      ? await params.permissionRepo.find({
          where: permissions.map((nome) => ({ nome })),
        })
      : params.defaultRoles[roleKey].permissions ?? [];

    if (permissions.length && resolvedPermissions.length !== permissions.length) {
      throw new BadRequestException(`Permissoes invalidas para usuario ${params.userEmail}`);
    }

    let role = await params.roleRepo.findOne({
      where: { nome: roleName, tenantId: params.tenant.id },
      relations: { permissions: true },
    });

    if (!role) {
      role = params.roleRepo.create({
        nome: roleName,
        descricao: `Perfil ${roleKey} do tenant ${params.tenant.slug}`,
        tenantId: params.tenant.id,
        permissions: resolvedPermissions,
      });
    } else {
      role.permissions = resolvedPermissions;
      role.descricao = `Perfil ${roleKey} do tenant ${params.tenant.slug}`;
    }

    return params.roleRepo.save(role);
  }

  private generateRandomPassword() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*';
    const size = 12;
    let result = '';
    for (let index = 0; index < size; index += 1) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return result;
  }

  private normalizePlanCode(value?: string | null) {
    if (!value) {
      return null;
    }

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

  private addDays(baseDate: Date, days: number) {
    const next = new Date(baseDate);
    next.setDate(next.getDate() + days);
    return next;
  }

  private hasStoreData(store?: ProvisionTenantDto['store']) {
    if (!store) {
      return false;
    }

    const values = [
      store.nome,
      store.cnpj,
      store.resumo,
      store.bannerUrl,
      store.logoUrl,
      store.horarioFuncionamento,
      store.localizacao,
      store.corFundo,
    ];

    return values.some((value) => typeof value === 'string' && value.trim().length > 0)
      || typeof store.habilitaVerificacaoMesa === 'boolean';
  }
}
