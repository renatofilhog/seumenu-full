import { ApiProperty } from '@nestjs/swagger';
import { PedidoStatus } from 'src/pedido/pedido-status.enum';

export class PedidoStatusOptionDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: PedidoStatus })
  value: PedidoStatus;

  @ApiProperty()
  label: string;
}
