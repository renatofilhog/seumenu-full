import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { SaasRole } from './saas-role.entity';

@Entity('saas_management_users')
export class SaasManagementUser {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty()
  @Column({ length: 100 })
  nome: string;

  @ApiProperty()
  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 255 })
  senha: string;

  @ApiProperty({ required: false })
  @Column({ name: 'ativo', default: true })
  ativo: boolean;

  @ApiProperty({ required: false, type: () => SaasRole })
  @ManyToOne(() => SaasRole, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'role_id' })
  role?: SaasRole;

  @ApiProperty()
  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criadoEm: Date;

  @ApiProperty()
  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  atualizadoEm: Date;
}
