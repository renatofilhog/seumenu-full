import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty({ required: false })
  @Column({ name: 'actor_user_id', nullable: true })
  actorUserId?: number;

  @ApiProperty({ required: false })
  @Column({ name: 'tenant_id', nullable: true })
  tenantId?: number;

  @ApiProperty()
  @Column({ name: 'entity_type', length: 60 })
  entityType: string;

  @ApiProperty({ required: false })
  @Column({ name: 'entity_id', length: 120, nullable: true })
  entityId?: string;

  @ApiProperty()
  @Column({ length: 80 })
  action: string;

  @ApiProperty({ required: false })
  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, unknown>;

  @ApiProperty({ required: false })
  @Column({ name: 'request_id', length: 120, nullable: true })
  requestId?: string;

  @ApiProperty()
  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
