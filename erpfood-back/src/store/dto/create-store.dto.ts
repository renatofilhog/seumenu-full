import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStoreDto {
  @ApiProperty()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiProperty()
  @IsNotEmpty()
  resumo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsUrl()
  bannerUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty()
  @IsNotEmpty()
  horarioFuncionamento: string;

  @ApiProperty()
  @IsNotEmpty()
  localizacao: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsHexColor()
  corFundo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  habilitaVerificacaoMesa?: boolean;

  @ApiProperty({ required: false, description: 'Tempo medio de preparo em minutos' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tempoMedioPreparo?: number;
}
