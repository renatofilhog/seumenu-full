import { ApiProperty } from "@nestjs/swagger";
import { Role } from "src/role/entities/role.entity";
import { Column, Entity, ManyToMany } from "typeorm";

@Entity('permissions')
export class Permission {
    @ApiProperty()
    @Column({ primary: true, generated: true })
    id: number;

    @ApiProperty()
    @Column()
    nome: string;

    @ApiProperty()
    @ManyToMany(() => Role, role => role.permissions)
    roles: Role[];

    @ApiProperty()
    @Column()
    descricao: string;
    
    @ApiProperty()
    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    criadoEm: Date;

    @ApiProperty()
    @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    atualizadoEm: Date;
}
