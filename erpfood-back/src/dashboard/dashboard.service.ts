import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { Product } from 'src/product/entities/product.entity';
import { Additional } from 'src/additional/entities/additional.entity';
import { ProductGroup } from 'src/product-group/entities/product-group.entity';
import { Mesa } from 'src/mesa/entities/mesa.entity';
import { PedidoStatus } from 'src/pedido/pedido-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Additional)
    private readonly additionalRepository: Repository<Additional>,
    @InjectRepository(ProductGroup)
    private readonly productGroupRepository: Repository<ProductGroup>,
    @InjectRepository(Mesa)
    private readonly mesaRepository: Repository<Mesa>,
  ) {}

  async getResumoDiario(tenantId: number) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [
      pedidosEmAndamentoHoje,
      totalProdutos,
      totalAdicionais,
      totalGruposProdutos,
      mesas,
      pedidosHoje,
    ] = await Promise.all([
      this.pedidoRepository.count({
        where: {
          tenantId,
          data: Between(startOfDay, endOfDay),
          status: { value: Not(In([PedidoStatus.FEITO, PedidoStatus.CANCELADO])) },
        },
      }),
      this.productRepository.count({ where: { tenantId } }),
      this.additionalRepository.count({ where: { tenantId } }),
      this.productGroupRepository.count({ where: { tenantId } }),
      this.mesaRepository.find({ where: { tenantId } }),
      this.pedidoRepository.find({
        where: {
          tenantId,
          data: Between(startOfDay, endOfDay),
        },
        relations: ['mesa', 'itens', 'itens.produto', 'itens.additionals', 'status'],
      }),
    ]);

    return {
      pedidosEmAndamentoHoje,
      totalProdutos,
      totalAdicionais,
      totalGruposProdutos,
      mesas,
      pedidosHoje,
    };
  }
}
