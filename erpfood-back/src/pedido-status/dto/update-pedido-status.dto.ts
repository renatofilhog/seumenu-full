import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PedidoStatus } from 'src/pedido/pedido-status.enum';

export class UpdatePedidoStatusDto {
  @ApiProperty({ enum: PedidoStatus })
  @IsNotEmpty()
  @IsEnum(PedidoStatus)
  status: PedidoStatus;
}
