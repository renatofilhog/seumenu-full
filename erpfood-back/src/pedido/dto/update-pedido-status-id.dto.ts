import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class UpdatePedidoStatusIdDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  statusId: number;
}
