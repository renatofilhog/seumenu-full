import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('tenant_domains')
export class TenantDomain {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty({ type: () => Tenant })
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ApiProperty({ required: false })
  @Column({ name: 'domain', length: 255, nullable: true, unique: true })
  domain?: string;

  @ApiProperty({ required: false })
  @Column({ name: 'subdomain', length: 100, nullable: true, unique: true })
  subdomain?: string;

  @ApiProperty()
  @Column({ name: 'is_primary', default: true })
  isPrimary: boolean;

  @ApiProperty()
  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criadoEm: Date;

  @ApiProperty()
  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  atualizadoEm: Date;
}
