import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty } from 'class-validator';

export class CreateProductGroupDto {
  @ApiProperty()
  @IsNotEmpty()
  nome: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  ativo: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  ordem: number;
}
