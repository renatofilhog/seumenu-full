import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreatePedidoItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  numeroPedido: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  produtoId: number;

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  additionalIds?: number[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  valorUnit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  qtSolicitada: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  vlDesconto: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  vlTotal: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacao?: string;
}
