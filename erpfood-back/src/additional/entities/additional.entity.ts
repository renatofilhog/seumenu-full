import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/product/entities/product.entity';
import { Column, Entity, ManyToMany } from 'typeorm';

@Entity('additionals')
export class Additional {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty()
  @Column({ length: 100 })
  nome: string;

  @ApiProperty({ required: false })
  @Column({ name: 'tenant_id', nullable: true })
  tenantId?: number;

  @ApiProperty()
  @Column({ name: 'quantidade_max' })
  quantidadeMax: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco: string;

  @ApiProperty()
  @Column({ default: true })
  ativo: boolean;

  @ApiProperty({ type: () => [Product] })
  @ManyToMany(() => Product, product => product.additionals)
  products: Product[];

  @ApiProperty()
  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criadoEm: Date;

  @ApiProperty()
  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  atualizadoEm: Date;
}
