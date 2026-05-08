import { ApiProperty } from '@nestjs/swagger';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { PedidoStatus } from 'src/pedido/pedido-status.enum';

export class PedidoStatusColumnDto {
  @ApiProperty({ enum: PedidoStatus })
  status: PedidoStatus;

  @ApiProperty({ type: () => [Pedido] })
  pedidos: Pedido[];
}
