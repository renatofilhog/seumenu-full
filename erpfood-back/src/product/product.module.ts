import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Additional } from 'src/additional/entities/additional.entity';
import { ProductGroup } from 'src/product-group/entities/product-group.entity';
import { Product } from './entities/product.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductGroup, Additional])],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
