import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumberString, IsOptional } from 'class-validator';

export class CreateAdditionalDto {
  @ApiProperty()
  @IsNotEmpty()
  nome: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  quantidadeMax: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  preco: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  ativo: boolean;

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  productIds?: number[];
}
