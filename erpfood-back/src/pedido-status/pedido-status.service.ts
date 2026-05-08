import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Subject } from 'rxjs';
import { PedidoStatusEntity } from './entities/pedido-status.entity';
import { PedidoStatus } from 'src/pedido/pedido-status.enum';

@Injectable()
export class PedidoStatusService {
  private readonly statusSubject = new Subject<Pedido>();

  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    @InjectRepository(PedidoStatusEntity)
    private readonly pedidoStatusRepository: Repository<PedidoStatusEntity>,
  ) {}

  async getStatusOptions() {
    return this.pedidoStatusRepository.find({ order: { id: 'ASC' } });
  }

  getStatusUpdates() {
    return this.statusSubject.asObservable();
  }

  emitStatusUpdate(pedido: Pedido) {
    this.statusSubject.next(pedido);
  }

  async getKanban(tenantId: number) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pedidos = await this.pedidoRepository.find({
      where: { tenantId, data: MoreThanOrEqual(since) },
      relations: ['mesa', 'itens', 'itens.produto', 'itens.additionals', 'status'],
      order: { data: 'DESC', numero: 'DESC' },
    });
    const statusOptions = (await this.getStatusOptions()).filter((status) =>
      [
        PedidoStatus.EM_ANALISE,
        PedidoStatus.PREPARANDO,
        PedidoStatus.FEITO,
      ].includes(status.value as PedidoStatus),
    );

    return statusOptions.map((status) => ({
      status: status.value,
      pedidos: pedidos.filter((pedido) => pedido.status?.value === status.value),
    }));
  }

  async updateStatus(id: number, status: PedidoStatus, tenantId: number) {
    const pedido = await this.pedidoRepository.findOne({
      where: { id, tenantId },
      relations: ['mesa', 'itens', 'itens.produto', 'itens.additionals', 'status'],
    });

    if (!pedido) {
      return null;
    }

    const statusEntity = await this.pedidoStatusRepository.findOne({
      where: { value: status },
    });
    if (!statusEntity) {
      return null;
    }

    pedido.status = statusEntity;
    pedido.ultimaInsercao = new Date();
    const saved = await this.pedidoRepository.save(pedido);
    this.emitStatusUpdate(saved);
    return saved;
  }
}
