import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Additional } from 'src/additional/entities/additional.entity';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { Product } from 'src/product/entities/product.entity';
import { In, Repository } from 'typeorm';
import { CreatePedidoItemDto } from './dto/create-pedido-item.dto';
import { UpdatePedidoItemDto } from './dto/update-pedido-item.dto';
import { PedidoItem } from './entities/pedido-item.entity';

@Injectable()
export class PedidoItemService {
  constructor(
    @InjectRepository(PedidoItem)
    private readonly pedidoItemRepository: Repository<PedidoItem>,
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Additional)
    private readonly additionalRepository: Repository<Additional>,
  ) {}

  async create(createPedidoItemDto: CreatePedidoItemDto, tenantId: number) {
    const { numeroPedido, produtoId, additionalIds, observacao, ...payload } = createPedidoItemDto;
    const pedido = await this.pedidoRepository.findOne({ where: { numero: numeroPedido, tenantId } });
    if (!pedido) {
      throw new BadRequestException('Pedido informado nao existe.');
    }

    const produto = await this.productRepository.findOneBy({ id: produtoId, tenantId });
    if (!produto) {
      throw new BadRequestException('Produto informado nao existe.');
    }

    const pedidoItem = this.pedidoItemRepository.create({
      ...payload,
      observacao: observacao?.trim() || null,
      tenantId,
      pedido,
      produto,
    });

    if (additionalIds?.length) {
      pedidoItem.additionals = await this.additionalRepository.findBy({ id: In(additionalIds), tenantId });
      if (pedidoItem.additionals.length !== additionalIds.length) {
        throw new BadRequestException('Adicionais informados nao existem.');
      }
    }

    return this.pedidoItemRepository.save(pedidoItem);
  }

  findAll(tenantId: number) {
    return this.pedidoItemRepository.find({
      where: { tenantId },
      relations: ['pedido', 'produto', 'additionals'],
    });
  }

  findOne(id: number, tenantId: number) {
    return this.pedidoItemRepository.findOne({
      where: { id, tenantId },
      relations: ['pedido', 'produto', 'additionals'],
    });
  }

  async update(id: number, updatePedidoItemDto: UpdatePedidoItemDto, tenantId: number) {
    const { numeroPedido, produtoId, additionalIds, ...payload } = updatePedidoItemDto;
    const pedidoItem = await this.pedidoItemRepository.findOne({
      where: { id, tenantId },
      relations: ['pedido', 'produto', 'additionals'],
    });

    if (!pedidoItem) {
      return null;
    }

    Object.assign(pedidoItem, payload);

    if (numeroPedido !== undefined) {
      const pedido = await this.pedidoRepository.findOne({ where: { numero: numeroPedido, tenantId } });
      if (!pedido) {
        throw new BadRequestException('Pedido informado nao existe.');
      }
      pedidoItem.pedido = pedido;
    }

    if (produtoId !== undefined) {
      const produto = await this.productRepository.findOneBy({ id: produtoId, tenantId });
      if (!produto) {
        throw new BadRequestException('Produto informado nao existe.');
      }
      pedidoItem.produto = produto;
    }

    if (additionalIds !== undefined) {
      pedidoItem.additionals = additionalIds.length
        ? await this.additionalRepository.findBy({ id: In(additionalIds), tenantId })
        : [];

      if (additionalIds.length && pedidoItem.additionals.length !== additionalIds.length) {
        throw new BadRequestException('Adicionais informados nao existem.');
      }
    }

    return this.pedidoItemRepository.save(pedidoItem);
  }
}
