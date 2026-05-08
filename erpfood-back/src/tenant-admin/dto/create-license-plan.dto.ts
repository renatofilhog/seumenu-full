import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, Matches, Min } from 'class-validator';

const allowedTypes = ['subscription', 'trial', 'custom'] as const;

export class CreateLicensePlanDto {
  @ApiProperty({ description: 'Unique plan code (slug-like)' })
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'code deve conter apenas letras minusculas, numeros e hifen',
  })
  code: string;

  @ApiProperty()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ enum: allowedTypes, default: 'subscription' })
  @IsOptional()
  @IsIn(allowedTypes)
  type?: (typeof allowedTypes)[number];

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  defaultDurationDays: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
