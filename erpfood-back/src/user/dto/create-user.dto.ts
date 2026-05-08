import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';


export class CreateUserDto {
    @ApiProperty()
    @IsNotEmpty()
    nome: string;
    
    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsNotEmpty()
    senha: string;

    @ApiProperty()
    @IsNotEmpty()
    roleId: number;
}
