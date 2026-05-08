import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { SaasPermission } from './saas-permission.entity';

@Entity('saas_roles')
export class SaasRole {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty()
  @Column({ length: 120, unique: true })
  nome: string;

  @ApiProperty({ required: false })
  @Column({ length: 255, nullable: true })
  descricao?: string;

  @ManyToMany(() => SaasPermission, { eager: true })
  @JoinTable({
    name: 'saas_role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: SaasPermission[];

  @ApiProperty()
  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criadoEm: Date;

  @ApiProperty()
  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  atualizadoEm: Date;
}
