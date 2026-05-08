import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class RenewTenantLicenseDto {
  @ApiProperty({ description: 'License model id used for renewal/activation', minimum: 1 })
  @IsInt()
  @Min(1)
  licenseModelId: number;
}
