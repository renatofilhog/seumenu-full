import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Additional } from 'src/additional/entities/additional.entity';
import { Mesa } from 'src/mesa/entities/mesa.entity';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { Product } from 'src/product/entities/product.entity';
import { ProductGroup } from 'src/product-group/entities/product-group.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, Product, Additional, ProductGroup, Mesa]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
