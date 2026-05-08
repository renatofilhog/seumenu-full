import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';

@Entity('license_plans')
export class LicensePlan {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty()
  @Column({ length: 100, unique: true })
  code: string;

  @ApiProperty()
  @Column({ length: 120 })
  nome: string;

  @ApiProperty()
  @Column({ length: 50, default: 'subscription' })
  type: string;

  @ApiProperty()
  @Column({ name: 'default_duration_days', type: 'int' })
  defaultDurationDays: number;

  @ApiProperty({ required: false, description: 'Legacy compatibility field kept while some databases still require duration_months.' })
  @Column({ name: 'duration_months', type: 'int', nullable: true })
  durationMonths?: number | null;

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
