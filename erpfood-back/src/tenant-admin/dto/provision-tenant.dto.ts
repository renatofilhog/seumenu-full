import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { ValidateNested } from 'class-validator';
import { ProvisionInitialUserDto } from './provision-initial-user.dto';
import { ProvisionStoreDto } from './provision-store.dto';

const allowedStatus = ['active', 'trial', 'suspended', 'expired'] as const;

export class ProvisionTenantDto {
  @ApiProperty()
  @IsNotEmpty()
  tenantName: string;

  @ApiProperty()
  @IsNotEmpty()
  tenantSlug: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  tenantActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  domain?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  subdomain?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  adminName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  adminPassword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  roleId?: number;

  @ApiProperty({ required: false, default: 'mensal' })
  @IsOptional()
  planType?: string;

  @ApiProperty({ required: false, description: 'Plan code from license_plans catalog (mensal/trimestral/semestral/anual)' })
  @IsOptional()
  planCode?: string;

  @ApiProperty({ enum: allowedStatus, default: 'active' })
  @IsIn(allowedStatus)
  licenseStatus: (typeof allowedStatus)[number];

  @ApiProperty({ required: false, description: 'ISO date string; defaults to current timestamp when omitted' })
  @IsOptional()
  startsAt?: string;

  @ApiProperty({ required: false, description: 'ISO date string; defaults from selected license plan duration when omitted' })
  @IsOptional()
  expiresAt?: string;

  @ApiProperty({ required: false, description: 'Override selected model duration in days' })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  graceUntil?: string;

  @ApiProperty({ required: false, description: 'Optional idempotency reference for external onboarding systems' })
  @IsOptional()
  externalRef?: string;

  @ApiProperty({ required: false, type: () => ProvisionStoreDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProvisionStoreDto)
  store?: ProvisionStoreDto;

  @ApiProperty({ required: false, type: () => [ProvisionInitialUserDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProvisionInitialUserDto)
  initialUsers?: ProvisionInitialUserDto[];
}
