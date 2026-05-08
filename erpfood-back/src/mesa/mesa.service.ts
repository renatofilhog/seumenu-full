import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { Mesa } from './entities/mesa.entity';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { Store } from 'src/store/entities/store.entity';
import { PedidoStatus } from 'src/pedido/pedido-status.enum';

@Injectable()
export class MesaService {
  constructor(
    @InjectRepository(Mesa)
    private readonly mesaRepository: Repository<Mesa>,
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  create(createMesaDto: CreateMesaDto, tenantId: number) {
    return this.mesaRepository.save({
      ...createMesaDto,
      tenantId,
    });
  }

  findAll(tenantId?: number) {
    return this.mesaRepository.find({
      where: tenantId ? { tenantId } : {},
    });
  }

  findOne(id: number, tenantId?: number) {
    return this.mesaRepository.findOneBy(tenantId ? { id, tenantId } : { id });
  }

  update(id: number, updateMesaDto: UpdateMesaDto, tenantId: number) {
    return this.mesaRepository.update({ id, tenantId }, updateMesaDto);
  }

  async hasPedidoRecente(mesaId: number, tenantId?: number) {
    const where = tenantId ? { tenantId } : {};
    const [store] = await this.storeRepository.find({ where, select: ['habilitaVerificacaoMesa'], take: 1 });
    if (!store?.habilitaVerificacaoMesa) {
      return false;
    }

    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const count = await this.pedidoRepository.count({
      where: {
        ...(tenantId ? { tenantId } : {}),
        mesa: tenantId ? { id: mesaId, tenantId } : { id: mesaId },
        status: { value: PedidoStatus.FEITO },
        data: Between(thirtyMinutesAgo, now),
      },
    });

    return count > 0;
  }
}
