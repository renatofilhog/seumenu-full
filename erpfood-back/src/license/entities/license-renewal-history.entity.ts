import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { License } from './license.entity';

@Entity('license_renewal_history')
export class LicenseRenewalHistory {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty({ type: () => License })
  @ManyToOne(() => License, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_license_id' })
  tenantLicense: License;

  @ApiProperty()
  @Column({ name: 'added_days', type: 'int' })
  addedDays: number;

  @ApiProperty()
  @Column({ name: 'previous_end_date', type: 'timestamp' })
  previousEndDate: Date;

  @ApiProperty()
  @Column({ name: 'new_end_date', type: 'timestamp' })
  newEndDate: Date;

  @ApiProperty({ required: false })
  @Column({ name: 'renewed_by_user_id', type: 'int', nullable: true })
  renewedByUserId?: number;

  @ApiProperty()
  @Column({ name: 'renewed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  renewedAt: Date;
}
