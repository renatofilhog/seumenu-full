import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTenantUserDto {
  @ApiProperty()
  @IsNotEmpty()
  nome: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false, description: 'Temporary password for invitation flow fallback' })
  @IsOptional()
  senha?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  roleId?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  ativo?: boolean;
}
