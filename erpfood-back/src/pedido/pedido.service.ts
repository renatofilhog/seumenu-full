import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Mesa } from 'src/mesa/entities/mesa.entity';
import { In, Repository } from 'typeorm';
import { Observable, Subject } from 'rxjs';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { Pedido } from './entities/pedido.entity';
import { PedidoStatusService } from 'src/pedido-status/pedido-status.service';
import { PedidoItem } from 'src/pedido-item/entities/pedido-item.entity';
import { Product } from 'src/product/entities/product.entity';
import { Additional } from 'src/additional/entities/additional.entity';
import { PedidoStatusEntity } from 'src/pedido-status/entities/pedido-status.entity';
import { PedidoStatus } from './pedido-status.enum';
import { CreatePedidoItemInputDto } from './dto/create-pedido-item-input.dto';
import { FindPedidoQueryDto } from './dto/find-pedido-query.dto';
import { PedidoEvent, PedidoEventType } from './types/pedido-event.type';

type PedidoListFilters = {
  dateFrom?: string;
  dateTo?: string;
  status?: PedidoStatus;
  valorMin?: string;
  valorMax?: string;
};

@Injectable()
export class PedidoService {
  private readonly pedidoEventsSubject = new Subject<PedidoEvent>();

  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    @InjectRepository(Mesa)
    private readonly mesaRepository: Repository<Mesa>,
    @InjectRepository(PedidoItem)
    private readonly pedidoItemRepository: Repository<PedidoItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Additional)
    private readonly additionalRepository: Repository<Additional>,
    @InjectRepository(PedidoStatusEntity)
    private readonly pedidoStatusRepository: Repository<PedidoStatusEntity>,
    private readonly pedidoStatusService: PedidoStatusService,
  ) {}

  async create(createPedidoDto: CreatePedidoDto, tenantId: number) {
    const { mesaId, itens, ...payload } = createPedidoDto as any;
    delete payload.numero;
    delete payload.data;
    delete payload.status;
    const mesa = await this.mesaRepository.findOneBy({ id: mesaId, tenantId });
    if (!mesa) {
      throw new BadRequestException('Mesa informada nao existe.');
    }

    const status = await this.pedidoStatusRepository.findOne({
      where: { value: PedidoStatus.EM_ANALISE },
    });
    if (!status) {
      throw new BadRequestException('Status inicial nao encontrado.');
    }

    const now = new Date();
    const pedido = this.pedidoRepository.create({
      ...payload,
      tenantId,
      mesa,
      status,
      data: now,
      ultimaInsercao: now,
    });

    let saved = (await this.pedidoRepository.save(pedido as any)) as Pedido;

    if (itens?.length) {
      await this.addItensToPedido(saved, itens, tenantId);
      const refreshed = await this.findOne(saved.id, tenantId);
      if (refreshed) {
        saved = refreshed;
      }
    }

    this.pedidoStatusService.emitStatusUpdate(saved);
    this.emitPedidoEvent('created', saved);
    return saved;
  }

  getPedidoEvents(): Observable<PedidoEvent> {
    return this.pedidoEventsSubject.asObservable();
  }

  emitPedidoEvent(type: PedidoEventType, pedido: Pedido) {
    this.pedidoEventsSubject.next({ type, pedido });
  }

  async findAll(tenantId: number, filters: PedidoListFilters = {}) {
    const dateFrom = this.parseDate(filters.dateFrom, false);
    const dateTo = this.parseDate(filters.dateTo, true);
    const valorMin = this.parseDecimal(filters.valorMin, 'valorMin');
    const valorMax = this.parseDecimal(filters.valorMax, 'valorMax');

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestException('dateFrom nao pode ser maior que dateTo.');
    }

    if (valorMin !== null && valorMax !== null && valorMin > valorMax) {
      throw new BadRequestException('valorMin nao pode ser maior que valorMax.');
    }

    const query = this.pedidoRepository
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.mesa', 'mesa')
      .leftJoinAndSelect('pedido.itens', 'itens')
      .leftJoinAndSelect('itens.produto', 'produto')
      .leftJoinAndSelect('itens.additionals', 'additionals')
      .leftJoinAndSelect('pedido.status', 'status')
      .where('pedido.tenant_id = :tenantId', { tenantId })
      .orderBy('pedido.data', 'DESC')
      .addOrderBy('pedido.numero', 'DESC');

    if (dateFrom) {
      query.andWhere('pedido.data >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      query.andWhere('pedido.data <= :dateTo', { dateTo });
    }

    if (filters.status) {
      query.andWhere('status.value = :status', { status: filters.status });
    }

    if (valorMin !== null) {
      query.andWhere('pedido.valor_total >= :valorMin', { valorMin });
    }

    if (valorMax !== null) {
      query.andWhere('pedido.valor_total <= :valorMax', { valorMax });
    }

    return query.getMany();
  }

  findOne(id: number, tenantId: number) {
    return this.pedidoRepository.findOne({
      where: { id, tenantId },
      relations: ['mesa', 'itens', 'itens.produto', 'itens.additionals', 'status'],
    });
  }

  async findByIdOrNumero(idOrNumero: number, tenantId: number) {
    let pedido = await this.findOne(idOrNumero, tenantId);
    if (pedido) {
      return pedido;
    }

    pedido = await this.pedidoRepository.findOne({
      where: { numero: idOrNumero, tenantId },
      relations: ['mesa', 'itens', 'itens.produto', 'itens.additionals', 'status'],
    });

    return pedido;
  }

  async update(id: number, updatePedidoDto: UpdatePedidoDto, tenantId: number) {
    const { mesaId, ...payload } = updatePedidoDto as any;
    delete payload.numero;
    delete payload.data;
    delete payload.status;
    const pedido = await this.pedidoRepository.findOne({
      where: { id, tenantId },
      relations: ['mesa', 'itens', 'itens.produto', 'itens.additionals', 'status'],
    });

    if (!pedido) {
      return null;
    }

    Object.assign(pedido, payload);

    if (mesaId !== undefined) {
      const mesa = await this.mesaRepository.findOneBy({ id: mesaId, tenantId });
      if (!mesa) {
        throw new BadRequestException('Mesa informada nao existe.');
      }
      pedido.mesa = mesa;
    }

    const saved = await this.pedidoRepository.save(pedido);

    return saved;
  }

  async getStatusIdByIdOrNumero(idOrNumero: number, tenantId: number) {
    const pedido = await this.findByIdOrNumero(idOrNumero, tenantId);

    return pedido?.status?.id ?? null;
  }

  async updateStatusById(pedidoId: number, statusId: number, tenantId: number) {
    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId, tenantId },
    });

    if (!pedido) {
      throw new BadRequestException('Pedido informado nao existe.');
    }

    const status = await this.pedidoStatusRepository.findOne({
      where: { id: statusId },
    });
    if (!status) {
      throw new BadRequestException('Status informado nao existe.');
    }

    await this.pedidoRepository.update({ id: pedido.id, tenantId }, {
      status: status as any,
      ultimaInsercao: new Date(),
    });

    const saved = await this.findOne(pedido.id, tenantId);
    if (!saved) {
      throw new BadRequestException('Pedido informado nao existe.');
    }

    this.pedidoStatusService.emitStatusUpdate(saved);
    this.emitPedidoEvent('updated', saved);
    return saved;
  }

  async addItensByNumero(numero: number, itens: CreatePedidoItemInputDto[], tenantId: number) {
    const pedido = await this.pedidoRepository.findOne({
      where: { numero, tenantId },
      relations: ['mesa', 'itens', 'itens.produto', 'itens.additionals', 'status'],
    });
    if (!pedido) {
      throw new BadRequestException('Pedido informado nao existe.');
    }

    await this.addItensToPedido(pedido, itens, tenantId);
    return this.findOne(pedido.id, tenantId);
  }

  private async addItensToPedido(pedido: Pedido, itens: CreatePedidoItemInputDto[], tenantId: number) {
    const items = await Promise.all(
      itens.map(async (item) => {
        const produto = await this.productRepository.findOneBy({ id: item.produtoId, tenantId });
        if (!produto) {
          throw new BadRequestException('Produto informado nao existe.');
        }

        const pedidoItem = this.pedidoItemRepository.create({
          tenantId,
          valorUnit: item.valorUnit,
          qtSolicitada: item.qtSolicitada,
          vlDesconto: item.vlDesconto,
          vlTotal: item.vlTotal,
          observacao: item.observacao?.trim() || null,
          pedido,
          produto,
        });

        if (item.additionalIds?.length) {
          pedidoItem.additionals = await this.additionalRepository.findBy({
            id: In(item.additionalIds),
            tenantId,
          });
          if (pedidoItem.additionals.length !== item.additionalIds.length) {
            throw new BadRequestException('Adicionais informados nao existem.');
          }
        }

        return pedidoItem;
      }),
    );

    await this.pedidoItemRepository.save(items);

    const allItems = await this.pedidoItemRepository.find({
      where: { pedido: { id: pedido.id, tenantId }, tenantId },
    });
    const totals = this.recalculateTotalsFromItems(allItems);
    pedido.valorLiq = totals.valorLiq;
    pedido.valorDesc = totals.valorDesc;
    pedido.valorTotal = totals.valorTotal;
    pedido.ultimaInsercao = new Date();

    await this.pedidoRepository.save(pedido);
  }

  private recalculateTotalsFromItems(itens: Array<CreatePedidoItemInputDto | PedidoItem>) {
    const sum = (values: number[]) =>
      values.reduce((total, value) => total + value, 0);

    const valorLiq = sum(
      itens.map((item) => Number(String(item.valorUnit).replace(',', '.')) * item.qtSolicitada),
    );
    const valorDesc = sum(
      itens.map((item) => Number(String(item.vlDesconto).replace(',', '.'))),
    );
    const valorTotal = sum(
      itens.map((item) => Number(String(item.vlTotal).replace(',', '.'))),
    );

    const format = (value: number) => value.toFixed(2);

    return {
      valorLiq: format(valorLiq),
      valorDesc: format(valorDesc),
      valorTotal: format(valorTotal),
    };
  }

  private parseDecimal(value: string | undefined, field: string) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const normalized = Number(String(value).replace(',', '.'));
    if (Number.isNaN(normalized)) {
      throw new BadRequestException(`${field} invalido.`);
    }

    return normalized;
  }

  private parseDate(value: string | undefined, endOfDay: boolean) {
    if (!value?.trim()) {
      return null;
    }

    const trimmed = value.trim();
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      ? `${trimmed}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`
      : trimmed;
    const parsed = new Date(normalized);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Data invalida: ${value}`);
    }

    return parsed;
  }
}
