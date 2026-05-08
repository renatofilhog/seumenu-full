import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';

@Entity('lojas')
export class Store {
  @ApiProperty()
  @Column({ primary: true, generated: true })
  id: number;

  @ApiProperty()
  @Column({ length: 150 })
  nome: string;

  @ApiProperty({ required: false })
  @Column({ name: 'tenant_id', nullable: true, unique: true })
  tenantId?: number;

  @ApiProperty({ required: false })
  @Column({ length: 20, nullable: true })
  cnpj?: string;

  @ApiProperty()
  @Column({ type: 'text' })
  resumo: string;

  @ApiProperty()
  @Column({ name: 'banner_url', type: 'text' })
  bannerUrl: string;

  @ApiProperty()
  @Column({ name: 'logo_url', type: 'text' })
  logoUrl: string;

  @ApiProperty()
  @Column({ name: 'horario_funcionamento', length: 255 })
  horarioFuncionamento: string;

  @ApiProperty()
  @Column({ length: 255 })
  localizacao: string;

  @ApiProperty()
  @Column({ name: 'cor_fundo', length: 20 })
  corFundo: string;

  @ApiProperty()
  @Column({ name: 'habilita_verificacao_mesa', default: false })
  habilitaVerificacaoMesa: boolean;

  @ApiProperty({ required: false })
  @Column({ name: 'tempo_medio_preparo', nullable: true })
  tempoMedioPreparo?: number;

  @ApiProperty()
  @Column({ default: true })
  ativo: boolean;

  @ApiProperty()
  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criadoEm: Date;

  @ApiProperty()
  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  atualizadoEm: Date;
}
