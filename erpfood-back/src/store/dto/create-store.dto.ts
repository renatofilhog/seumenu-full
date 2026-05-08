import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

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
}
