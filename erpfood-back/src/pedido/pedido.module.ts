import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mesa } from 'src/mesa/entities/mesa.entity';
import { PedidoStatusModule } from 'src/pedido-status/pedido-status.module';
import { PedidoController } from './pedido.controller';
import { PedidoService } from './pedido.service';
import { Pedido } from './entities/pedido.entity';
import { PedidoItem } from 'src/pedido-item/entities/pedido-item.entity';
import { Product } from 'src/product/entities/product.entity';
import { Additional } from 'src/additional/entities/additional.entity';
import { PedidoStatusEntity } from 'src/pedido-status/entities/pedido-status.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pedido,
      Mesa,
      PedidoItem,
      Product,
      Additional,
      PedidoStatusEntity,
    ]),
    PedidoStatusModule,
  ],
  controllers: [PedidoController],
  providers: [PedidoService],
  exports: [PedidoService],
})
export class PedidoModule {}
