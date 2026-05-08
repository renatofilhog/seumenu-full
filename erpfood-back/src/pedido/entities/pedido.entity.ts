import { ApiProperty } from '@nestjs/swagger';
import { Mesa } from 'src/mesa/entities/mesa.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PedidoItem } from 'src/pedido-item/entities/pedido-item.entity';
import { PedidoStatusEntity } from 'src/pedido-status/entities/pedido-status.entity';
import { PedidoPaymentMethod } from '../pedido-payment-method.enum';

@Entity('pedidos')
export class Pedido {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty()
  @Column({ unique: true, default: () => "nextval('pedido_numero_seq')" })
  numero: number;

  @ApiProperty({ required: false })
  @Column({ name: 'tenant_id', nullable: true })
  tenantId?: number;

  @ApiProperty()
  @Column({ name: 'valor_liq', type: 'decimal', precision: 10, scale: 2 })
  valorLiq: string;

  @ApiProperty()
  @Column({ name: 'valor_desc', type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorDesc: string;

  @ApiProperty()
  @Column({ name: 'valor_total', type: 'decimal', precision: 10, scale: 2 })
  valorTotal: string;

  @ApiProperty()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data: Date;

  @ApiProperty({ type: () => PedidoStatusEntity })
  @ManyToOne(() => PedidoStatusEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'status_id' })
  status: PedidoStatusEntity;

  @ApiProperty({ required: false })
  @Column({ name: 'cod_cupom', length: 50, nullable: true })
  codCupom?: string;

  @ApiProperty({ required: false })
  @Column({ name: 'nome_cliente', length: 150, nullable: true })
  nomeCliente?: string;

  @ApiProperty({ required: false })
  @Column({ name: 'telefone_cliente', length: 30, nullable: true })
  telefoneCliente?: string;

  @ApiProperty({ required: false, enum: PedidoPaymentMethod })
  @Column({ name: 'forma_pagamento', length: 30, nullable: true })
  formaPagamento?: PedidoPaymentMethod;

  @ApiProperty({ type: () => Mesa })
  @ManyToOne(() => Mesa, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'mesa_id' })
  mesa: Mesa;

  @ApiProperty({ type: () => [PedidoItem] })
  @OneToMany(() => PedidoItem, item => item.pedido)
  itens: PedidoItem[];

  @ApiProperty()
  @Column({ name: 'ultima_insercao', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  ultimaInsercao: Date;

  @ApiProperty()
  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criadoEm: Date;

  @ApiProperty()
  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  atualizadoEm: Date;
}
