import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty()
  @IsNotEmpty()
  nome: string;

  @ApiProperty()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ required: false })
  @IsOptional()
  dominio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  subdominio?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  ativo?: boolean;
}
