import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from 'src/audit/entities/audit-log.entity';
import { Repository } from 'typeorm';
import { ChangeCurrentPasswordDto } from './dto/change-current-password.dto';
import { UpdateSaasManagementUserDto } from './dto/update-saas-management-user.dto';
import { SaasManagementUser } from './entities/saas-management-user.entity';
import { SaasRole } from './entities/saas-role.entity';
import { PasswordService } from 'src/security/password.service';

type AuditContext = {
  actorUserId?: number;
  requestId?: string;
};

@Injectable()
export class SaasManagementService {
  constructor(
    @InjectRepository(SaasManagementUser)
    private readonly saasManagementUserRepository: Repository<SaasManagementUser>,
    @InjectRepository(SaasRole)
    private readonly saasRoleRepository: Repository<SaasRole>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly passwordService: PasswordService,
  ) {}

  async findUsers() {
    const users = await this.saasManagementUserRepository.find({
      order: { id: 'ASC' },
    });

    return users.map((user) => ({
      id: user.id,
      nome: user.nome,
      email: user.email,
      ativo: user.ativo,
      role: user.role ? { id: user.role.id, nome: user.role.nome } : null,
    }));
  }

  async findRoles() {
    const roles = await this.saasRoleRepository.find({
      order: { nome: 'ASC' },
    });

    return roles.map((role) => ({
      id: role.id,
      nome: role.nome,
      descricao: role.descricao ?? null,
    }));
  }

  async updateUser(id: number, dto: UpdateSaasManagementUserDto, context?: AuditContext) {
    const user = await this.saasManagementUserRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario SaaS nao encontrado');
    }

    if (dto.nome !== undefined) {
      user.nome = dto.nome.trim();
    }

    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const duplicate = await this.saasManagementUserRepository.findOne({ where: { email: normalizedEmail } });
      if (duplicate && duplicate.id !== user.id) {
        throw new BadRequestException('Ja existe usuario SaaS com esse e-mail');
      }
      user.email = normalizedEmail;
    }

    if (dto.roleId !== undefined) {
      if (dto.roleId === null) {
        user.role = undefined;
      } else {
        const role = await this.saasRoleRepository.findOne({ where: { id: dto.roleId } });
        if (!role) {
          throw new NotFoundException('Perfil SaaS nao encontrado');
        }
        user.role = role;
      }
    }

    if (dto.ativo !== undefined) {
      user.ativo = dto.ativo;
    }

    const saved = await this.saasManagementUserRepository.save(user);
    await this.writeAuditLog({
      action: 'saas_user.update',
      entityType: 'saas_management_user',
      entityId: String(saved.id),
      details: {
        nome: saved.nome,
        email: saved.email,
        ativo: saved.ativo,
        roleId: saved.role?.id ?? null,
      },
      context,
    });

    return {
      id: saved.id,
      nome: saved.nome,
      email: saved.email,
      ativo: saved.ativo,
      role: saved.role ? { id: saved.role.id, nome: saved.role.nome } : null,
    };
  }

  async changeCurrentPassword(userId: number, dto: ChangeCurrentPasswordDto, context?: AuditContext) {
    const user = await this.saasManagementUserRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario SaaS nao encontrado');
    }

    const currentPasswordMatches = await this.passwordService.verify(dto.currentPassword, user.senha);
    if (!currentPasswordMatches) {
      throw new BadRequestException('Senha atual invalida');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Nova senha e confirmacao nao conferem');
    }

    user.senha = await this.passwordService.hash(dto.newPassword);
    await this.saasManagementUserRepository.save(user);

    await this.writeAuditLog({
      action: 'saas_user.change_password',
      entityType: 'saas_management_user',
      entityId: String(user.id),
      details: { changedBySelf: true },
      context,
    });

    return { success: true };
  }

  private async writeAuditLog(params: {
    action: string;
    entityType: string;
    entityId?: string;
    details?: Record<string, unknown>;
    context?: AuditContext;
  }) {
    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details,
        actorUserId: params.context?.actorUserId,
        requestId: params.context?.requestId,
      }),
    );
  }
}
