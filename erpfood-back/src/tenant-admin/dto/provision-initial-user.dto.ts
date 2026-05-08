import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

const allowedRoles = ['admin', 'cozinha', 'atendimento'] as const;

export class ProvisionInitialUserDto {
  @ApiProperty()
  @IsString()
  nome: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: allowedRoles, required: false, default: 'atendimento' })
  @IsOptional()
  @IsIn(allowedRoles)
  roleKey?: (typeof allowedRoles)[number];

  @ApiProperty({ type: [String], required: false, description: 'Permission names for custom user role' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
