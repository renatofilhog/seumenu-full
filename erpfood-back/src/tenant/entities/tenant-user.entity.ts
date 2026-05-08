import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/role/entities/role.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('tenant_users')
export class TenantUser {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty({ type: () => Tenant })
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ type: () => Role, required: false })
  @ManyToOne(() => Role, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role?: Role;

  @ApiProperty()
  @Column({ default: true })
  ativo: boolean;

  @ApiProperty()
  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criadoEm: Date;

  @ApiProperty()
  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  atualizadoEm: Date;
}
