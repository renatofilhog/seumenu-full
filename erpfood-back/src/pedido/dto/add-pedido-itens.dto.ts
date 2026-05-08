import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePedidoItemInputDto } from './create-pedido-item-input.dto';

export class AddPedidoItensDto {
  @ApiProperty({ type: [CreatePedidoItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoItemInputDto)
  itens: CreatePedidoItemInputDto[];
}
