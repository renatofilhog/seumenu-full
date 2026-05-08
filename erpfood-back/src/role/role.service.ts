import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from 'src/permission/entities/permission.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission) private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto, tenantId: number) {
    const permissions = createRoleDto.permissionIds?.length
      ? await this.permissionRepository.findBy({ id: In(createRoleDto.permissionIds) })
      : [];

    return this.roleRepository.save(
      this.roleRepository.create({
        nome: createRoleDto.nome,
        descricao: createRoleDto.descricao,
        tenantId,
        permissions,
      }),
    );
  }

  findAll(tenantId: number) {
    return this.roleRepository.find({
      where: { tenantId },
      relations: { permissions: true },
      order: { nome: 'ASC', id: 'ASC' },
    });
  }

  findOne(id: number, tenantId: number) {
    return this.roleRepository.findOne({
      where: { id, tenantId },
      relations: { permissions: true },
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto, tenantId: number) {
    const role = await this.roleRepository.findOne({
      where: { id, tenantId },
      relations: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException('Papel nao encontrado para o tenant informado');
    }

    if (updateRoleDto.nome !== undefined) role.nome = updateRoleDto.nome;
    if (updateRoleDto.descricao !== undefined) role.descricao = updateRoleDto.descricao;
    if (updateRoleDto.permissionIds !== undefined) {
      role.permissions = updateRoleDto.permissionIds.length
        ? await this.permissionRepository.findBy({ id: In(updateRoleDto.permissionIds) })
        : [];
    }

    return this.roleRepository.save(role);
  }

  remove(id: number, tenantId: number) {
    return this.roleRepository.delete({ id, tenantId });
  }
}
