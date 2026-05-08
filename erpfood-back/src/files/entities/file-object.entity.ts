import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';

@Entity('files')
export class FileObject {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty({ required: false })
  @Column({ name: 'tenant_id', nullable: true })
  tenantId?: number;

  @ApiProperty()
  @Column({ length: 40, default: 's3' })
  provider: string;

  @ApiProperty()
  @Column({ length: 150 })
  bucket: string;

  @ApiProperty()
  @Column({ name: 'object_key', length: 500 })
  objectKey: string;

  @ApiProperty()
  @Column({ name: 'original_filename', length: 255 })
  originalFilename: string;

  @ApiProperty()
  @Column({ name: 'content_type', length: 160 })
  contentType: string;

  @ApiProperty()
  @Column({ type: 'bigint' })
  size: string;

  @ApiProperty({ required: false })
  @Column({ length: 80, nullable: true })
  etag?: string;

  @ApiProperty({ required: false })
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @ApiProperty()
  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
