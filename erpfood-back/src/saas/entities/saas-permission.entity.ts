import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';

@Entity('saas_permissions')
export class SaasPermission {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty()
  @Column({ length: 120, unique: true })
  nome: string;

  @ApiProperty({ required: false })
  @Column({ length: 255, nullable: true })
  descricao?: string;

  @ApiProperty()
  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criadoEm: Date;

  @ApiProperty()
  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  atualizadoEm: Date;
}
