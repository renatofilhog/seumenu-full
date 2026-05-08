import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class RenewLicenseDto {
  @ApiProperty({ description: 'Days to add to current license period', minimum: 1 })
  @IsInt()
  @Min(1)
  addedDays: number;
}
