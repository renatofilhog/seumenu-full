import { ApiProperty } from '@nestjs/swagger';
import { Additional } from 'src/additional/entities/additional.entity';
import { ProductGroup } from 'src/product-group/entities/product-group.entity';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';

@Entity('products')
export class Product {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty()
  @Column({ length: 150 })
  nome: string;

  @ApiProperty({ required: false })
  @Column({ name: 'tenant_id', nullable: true })
  tenantId?: number;

  @ApiProperty()
  @Column({ type: 'text' })
  descricao: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco: string;

  @ApiProperty()
  @Column({ default: true })
  ativo: boolean;

  @ApiProperty()
  @Column({ default: false })
  destaque: boolean;

  @ApiProperty()
  @Column({ name: 'imagem_url', length: 255 })
  imagemUrl: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  ordem?: number;

  @ApiProperty({ type: () => [ProductGroup] })
  @ManyToMany(() => ProductGroup, group => group.products)
  @JoinTable({
    name: 'product_group_products',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_group_id', referencedColumnName: 'id' },
  })
  grupos: ProductGroup[];

  @ApiProperty({ type: () => [Additional] })
  @ManyToMany(() => Additional, additional => additional.products)
  @JoinTable({
    name: 'product_additionals',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
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
