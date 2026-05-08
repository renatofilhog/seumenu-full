import { Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission) private readonly permissionRepository: Repository<Permission>,
  ) {}

  create(createPermissionDto: CreatePermissionDto) {
    return this.permissionRepository.save(createPermissionDto);
  }

  findAll() {
    return this.permissionRepository.find();
  }

  findOne(id: number) {
    return this.permissionRepository.findOneBy({ id });
  }

  update(id: number, updatePermissionDto: UpdatePermissionDto) {
    return this.permissionRepository.update(id, updatePermissionDto);
  }

  remove(id: number) {
    return this.permissionRepository.delete(id);
  }
}
