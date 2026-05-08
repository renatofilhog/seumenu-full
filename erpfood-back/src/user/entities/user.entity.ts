import { ApiProperty } from "@nestjs/swagger";
import { Role } from "src/role/entities/role.entity";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";

@Entity('usuarios')
export class User {
    @ApiProperty()
    @Column({ primary: true, generated: true })
    id: number;
    
    @ApiProperty()
    @Column({ length: 100 })
    nome: string;

    @ApiProperty()
    @Column({ length: 100, unique: true })
    email: string;

    @ApiProperty({ required: false })
    @Column({ name: 'tenant_id', nullable: true })
    tenantId?: number;

    @Column({ length: 255 })
    senha: string;

    @ApiProperty({ required: false })
    @Column({ name: 'force_password_change', default: false })
    forcePasswordChange?: boolean;

    @ApiProperty()
    @OneToOne(() => Role)
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @ApiProperty()
    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    criadoEm: Date;

    @ApiProperty()
    @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    atualizadoEm: Date;
}
