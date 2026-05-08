import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Role } from 'src/role/entities/role.entity';
import { PasswordService } from 'src/security/password.service';
import { ChangeCurrentPasswordDto } from './dto/change-current-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    private readonly passwordService: PasswordService,
  ) {}

  async create(createUserDto: CreateUserDto, tenantId: number) {
    const role = await this.roleRepository.findOneBy({ id: createUserDto.roleId, tenantId });
    if (!role) {
      throw new NotFoundException('Papel nao encontrado para o tenant informado');
    }

    return this.userRepository.save(
      this.userRepository.create({
        nome: createUserDto.nome,
        email: createUserDto.email,
        senha: await this.passwordService.hash(createUserDto.senha),
        tenantId,
        role,
      }),
    );
  }

  findAll(tenantId: number) {
    return this.userRepository.find({
      where: { tenantId },
      relations: { role: true },
      order: { nome: 'ASC', id: 'ASC' },
    });
  }

  findOne(id: number, tenantId: number) {
    return this.userRepository.findOne({
      where: { id, tenantId },
      relations: { role: true },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto, tenantId: number) {
    const user = await this.userRepository.findOne({
      where: { id, tenantId },
      relations: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado para o tenant informado');
    }

    if (updateUserDto.roleId !== undefined) {
      const role = await this.roleRepository.findOneBy({ id: updateUserDto.roleId, tenantId });
      if (!role) {
        throw new NotFoundException('Papel nao encontrado para o tenant informado');
      }
      user.role = role;
    }

    if (updateUserDto.nome !== undefined) user.nome = updateUserDto.nome;
    if (updateUserDto.email !== undefined) user.email = updateUserDto.email;
    if (updateUserDto.senha !== undefined && updateUserDto.senha !== '') {
      user.senha = await this.passwordService.hash(updateUserDto.senha);
    }

    return this.userRepository.save(user);
  }

  async changeCurrentPassword(userId: number, tenantId: number, dto: ChangeCurrentPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado para o tenant informado');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Nova senha e confirmacao nao conferem');
    }

    if (!user.forcePasswordChange) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Senha atual obrigatoria');
      }
      const currentPasswordMatches = await this.passwordService.verify(dto.currentPassword, user.senha);
      if (!currentPasswordMatches) {
        throw new BadRequestException('Senha atual invalida');
      }
    }

    user.senha = await this.passwordService.hash(dto.newPassword);
    user.forcePasswordChange = false;
    await this.userRepository.save(user);

    return { success: true, forcePasswordChange: false };
  }

  remove(id: number, tenantId: number) {
    return this.userRepository.delete({ id, tenantId });
  }
}
