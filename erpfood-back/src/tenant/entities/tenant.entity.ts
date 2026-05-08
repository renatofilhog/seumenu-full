import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty()
  @Column({ length: 150 })
  nome: string;

  @ApiProperty()
  @Column({ length: 120, unique: true })
  slug: string;

  @ApiProperty({ required: false })
  @Column({ length: 255, nullable: true })
  dominio?: string;

  @ApiProperty({ required: false })
  @Column({ length: 100, nullable: true })
  subdominio?: string;

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
