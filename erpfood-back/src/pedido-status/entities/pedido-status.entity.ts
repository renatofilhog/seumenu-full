import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';

@Entity('pedido_status')
export class PedidoStatusEntity {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty()
  @Column({ length: 20, unique: true })
  value: string;

  @ApiProperty()
  @Column({ length: 50 })
  label: string;
}
