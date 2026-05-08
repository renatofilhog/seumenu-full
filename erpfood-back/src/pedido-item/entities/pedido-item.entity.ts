import { ApiProperty } from '@nestjs/swagger';
import { Additional } from 'src/additional/entities/additional.entity';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { Product } from 'src/product/entities/product.entity';
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';

@Entity('pedido_itens')
export class PedidoItem {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty({ required: false })
  @Column({ name: 'tenant_id', nullable: true })
  tenantId?: number;

  @ApiProperty()
  @Column({ name: 'valor_unit', type: 'decimal', precision: 10, scale: 2 })
  valorUnit: string;

  @ApiProperty()
  @Column({ name: 'qt_solicitada' })
  qtSolicitada: number;

  @ApiProperty()
  @Column({ name: 'vl_desconto', type: 'decimal', precision: 10, scale: 2, default: 0 })
  vlDesconto: string;

  @ApiProperty()
  @Column({ name: 'vl_total', type: 'decimal', precision: 10, scale: 2 })
  vlTotal: string;

  @ApiProperty({ required: false })
  @Column({ name: 'observacao', type: 'text', nullable: true })
  observacao?: string | null;

  @ApiProperty({ type: () => Pedido })
  @ManyToOne(() => Pedido, pedido => pedido.itens, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @ApiProperty({ type: () => Product })
  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  produto: Product;

  @ApiProperty({ type: () => [Additional] })
  @ManyToMany(() => Additional)
  @JoinTable({
    name: 'pedido_item_additionals',
    joinColumn: { name: 'pedido_item_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'additional_id', referencedColumnName: 'id' },
  })
  additionals: Additional[];

  @ApiProperty()
  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criadoEm: Date;

  @ApiProperty()
  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  atualizadoEm: Date;
}
