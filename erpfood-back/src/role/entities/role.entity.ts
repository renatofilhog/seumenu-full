import { ApiProperty } from "@nestjs/swagger";
import { Permission } from "src/permission/entities/permission.entity";
import { Column, Entity, JoinTable, ManyToMany } from "typeorm";

@Entity('roles')
export class Role {
    @ApiProperty()
    @Column({ primary: true, generated: true })
    id: number;
    
    @ApiProperty()
    @Column({ length: 255 })
    nome: string;
    
    @ApiProperty()
    @Column()
    descricao: string;

    @ApiProperty({ required: false })
    @Column({ name: 'tenant_id', nullable: true })
    tenantId?: number;
    
    @ApiProperty()
    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    criadoEm: Date;

    @ApiProperty()
    @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    atualizadoEm: Date;

    @ApiProperty()
    @ManyToMany(() => Permission, permission => permission.roles)
    @JoinTable({
        name: 'role_permissions',
        joinColumn: { name: 'role_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
    })
    permissions: Permission[];
}
