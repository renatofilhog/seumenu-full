import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsInt, IsNotEmpty, IsOptional } from "class-validator";

export class CreateRoleDto {
    @ApiProperty()
    @IsNotEmpty()
    nome: string;
    
    @ApiProperty()
    @IsNotEmpty()
    descricao: string;

    @ApiProperty({ required: false, type: [Number] })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    permissionIds?: number[];
}
