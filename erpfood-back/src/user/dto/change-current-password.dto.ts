import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class ChangeCurrentPasswordDto {
  @ApiProperty({ required: false })
  @IsOptional()
  currentPassword?: string;

  @ApiProperty()
  @IsNotEmpty()
  newPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  confirmPassword: string;
}
