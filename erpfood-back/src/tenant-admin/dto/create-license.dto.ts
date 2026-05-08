import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

const allowedStatus = ['active', 'suspended', 'expired', 'trial'] as const;

export class CreateLicenseDto {
  @ApiProperty({ description: 'License model code' })
  @IsNotEmpty()
  planType: string;

  @ApiProperty({ enum: allowedStatus, default: 'active' })
  @IsIn(allowedStatus)
  @IsOptional()
  status?: (typeof allowedStatus)[number];

  @ApiProperty({ description: 'ISO date string; defaults to now', required: false })
  @IsOptional()
  startsAt?: string;

  @ApiProperty({ description: 'ISO date string; defaults to startsAt + model duration', required: false })
  @IsOptional()
  expiresAt?: string;

  @ApiProperty({ required: false, description: 'ISO date string' })
  @IsOptional()
  graceUntil?: string;

  @ApiProperty({ required: false, description: 'Override model duration in days' })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;
}
