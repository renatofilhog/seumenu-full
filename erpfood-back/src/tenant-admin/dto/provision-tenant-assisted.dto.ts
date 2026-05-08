import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, Matches, Min } from 'class-validator';
import { ValidateNested } from 'class-validator';
import { ProvisionInitialUserDto } from './provision-initial-user.dto';
import { ProvisionStoreDto } from './provision-store.dto';

const allowedStatus = ['active', 'trial', 'suspended', 'expired'] as const;

export class ProvisionTenantAssistedDto {
  @ApiProperty()
  @IsNotEmpty()
  tenantName: string;

  @ApiProperty({ description: 'Unique tenant slug (tenantId) used for tenant isolation and routing.' })
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'tenantSlug deve conter apenas letras minusculas, numeros e hifen',
  })
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

  @ApiProperty({ description: 'Plan code from seeded catalog: mensal/trimestral/semestral/anual' })
  @IsNotEmpty()
  planCode: string;

  @ApiProperty({ enum: allowedStatus, required: false, default: 'active' })
  @IsOptional()
  @IsIn(allowedStatus)
  licenseStatus?: (typeof allowedStatus)[number];

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
