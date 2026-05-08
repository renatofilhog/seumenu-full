import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Additional } from 'src/additional/entities/additional.entity';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { Product } from 'src/product/entities/product.entity';
import { PedidoItemController } from './pedido-item.controller';
import { PedidoItemService } from './pedido-item.service';
import { PedidoItem } from './entities/pedido-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PedidoItem, Pedido, Product, Additional])],
  controllers: [PedidoItemController],
  providers: [PedidoItemService],
})
export class PedidoItemModule {}
