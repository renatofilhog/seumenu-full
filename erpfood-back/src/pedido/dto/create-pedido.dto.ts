import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePedidoItemInputDto } from './create-pedido-item-input.dto';
import { PedidoPaymentMethod } from '../pedido-payment-method.enum';

export class CreatePedidoDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  valorLiq: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  valorDesc: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  valorTotal: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  mesaId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  codCupom?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nomeCliente: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  telefoneCliente: string;

  @ApiProperty({ enum: PedidoPaymentMethod })
  @IsNotEmpty()
  @IsEnum(PedidoPaymentMethod)
  formaPagamento: PedidoPaymentMethod;

  @ApiProperty({ required: false, type: [CreatePedidoItemInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoItemInputDto)
  itens?: CreatePedidoItemInputDto[];
}
