import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaasManagementUser } from 'src/saas/entities/saas-management-user.entity';
import { PasswordService } from 'src/security/password.service';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { TenantUser } from 'src/tenant/entities/tenant-user.entity';
import { User } from '../user/entities/user.entity';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant) private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantUser) private readonly tenantUserRepository: Repository<TenantUser>,
    @InjectRepository(SaasManagementUser)
    private readonly saasManagementUserRepository: Repository<SaasManagementUser>,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  async login(email: string, senha: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: {
        role: {
          permissions: true,
        },
      },
    });

    if (!user || !(await this.passwordService.verify(senha, user.senha))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tenant = await this.resolveTenantForLogin(user);
    if (!tenant) {
      throw new UnauthorizedException('Usuario sem tenant ativo vinculado');
    }

    const permissions = user.role?.permissions?.map((permission) => permission.nome) ?? [];

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      nome: user.nome,
      principalType: 'app_user',
      tenantId: tenant.id,
      roleId: user.role?.id,
      role: user.role?.nome,
      forcePasswordChange: Boolean(user.forcePasswordChange),
      permissions,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      permissions,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role?.nome,
        forcePasswordChange: Boolean(user.forcePasswordChange),
      },
      tenant: {
        id: tenant.id,
        nome: tenant.nome,
        slug: tenant.slug,
      },
    };
  }

  private async resolveTenantForLogin(user: User): Promise<Tenant | null> {
    if (user.tenantId) {
      const tenantFromColumn = await this.tenantRepository.findOne({
        where: { id: user.tenantId, ativo: true },
        select: { id: true, slug: true, nome: true, ativo: true },
      });
      if (tenantFromColumn) {
        return tenantFromColumn;
      }
    }

    const tenantMembership = await this.tenantUserRepository.findOne({
      where: {
        user: { id: user.id },
        ativo: true,
        tenant: { ativo: true },
      },
      relations: {
        tenant: true,
      },
      order: {
        id: 'ASC',
      },
    });

    return tenantMembership?.tenant ?? null;
  }

  async loginSaas(email: string, senha: string) {
    const user = await this.saasManagementUserRepository.findOne({
      where: { email, ativo: true },
      relations: {
        role: {
          permissions: true,
        },
      },
    });

    if (!user || !(await this.passwordService.verify(senha, user.senha))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const permissions = user.role?.permissions?.map((permission) => permission.nome) ?? [];
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      nome: user.nome,
      principalType: 'saas_management_user',
      roleId: user.role?.id,
      role: user.role?.nome,
      permissions,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      permissions,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role?.nome ?? 'saas_user',
      },
    };
  }
}
