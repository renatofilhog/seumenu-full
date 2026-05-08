import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty } from 'class-validator';

export class CreateMesaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  numero: number;

  @ApiProperty()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty()
  @IsNotEmpty()
  setor: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  ativo: boolean;
}
