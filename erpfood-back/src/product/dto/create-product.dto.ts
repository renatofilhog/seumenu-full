import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsNotEmpty()
  nome: string;

  @ApiProperty()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  preco: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  ativo: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  destaque?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsUrl()
  imagemUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  ordem?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  grupoId?: number;

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  grupoIds?: number[];

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  additionalIds?: number[];
}
