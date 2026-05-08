import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsHexColor, IsOptional, IsString } from 'class-validator';

export class ProvisionStoreDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resumo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  horarioFuncionamento?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  localizacao?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsHexColor()
  corFundo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  habilitaVerificacaoMesa?: boolean;
}
