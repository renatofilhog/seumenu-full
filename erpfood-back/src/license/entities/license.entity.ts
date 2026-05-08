import { ApiProperty } from '@nestjs/swagger';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { LicensePlan } from './license-plan.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { LicenseRenewalHistory } from './license-renewal-history.entity';

export type LicenseStatus = 'active' | 'suspended' | 'expired' | 'trial';

@Entity('licenses')
export class License {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty({ type: () => Tenant })
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ApiProperty()
  @Column({ name: 'plan_type', length: 50 })
  planType: string;

  @ApiProperty({ required: false, type: () => LicensePlan })
  @ManyToOne(() => LicensePlan, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plan_id' })
  plan?: LicensePlan;

  @OneToMany(() => LicenseRenewalHistory, (renewal) => renewal.tenantLicense)
  renewals?: LicenseRenewalHistory[];

  @ApiProperty()
  @Column({ length: 20 })
  status: LicenseStatus;

  @ApiProperty()
  @Column({ name: 'starts_at', type: 'timestamp' })
  startsAt: Date;

  @ApiProperty()
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @ApiProperty({ required: false })
  @Column({ name: 'grace_until', type: 'timestamp', nullable: true })
  graceUntil?: Date;

  @ApiProperty({ required: false })
  @Column({ name: 'last_checked_at', type: 'timestamp', nullable: true })
  lastCheckedAt?: Date;

  @ApiProperty()
  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criadoEm: Date;

  @ApiProperty()
  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  atualizadoEm: Date;
}
