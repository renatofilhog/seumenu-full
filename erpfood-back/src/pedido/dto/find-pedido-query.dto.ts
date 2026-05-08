import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
import { PedidoStatus } from '../pedido-status.enum';

export class FindPedidoQueryDto {
  @ApiPropertyOptional({
    description: 'Data inicial do filtro. Aceita YYYY-MM-DD ou timestamp ISO.',
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Data final do filtro. Aceita YYYY-MM-DD ou timestamp ISO.',
  })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: PedidoStatus })
  @IsOptional()
  @IsEnum(PedidoStatus)
  status?: PedidoStatus;

  @ApiPropertyOptional({ description: 'Valor minimo total do pedido.' })
  @IsOptional()
  @IsNumberString()
  valorMin?: string;

  @ApiPropertyOptional({ description: 'Valor maximo total do pedido.' })
  @IsOptional()
  @IsNumberString()
  valorMax?: string;
}
