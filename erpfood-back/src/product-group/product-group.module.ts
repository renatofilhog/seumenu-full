import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductGroupController } from './product-group.controller';
import { ProductGroupService } from './product-group.service';
import { ProductGroup } from './entities/product-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductGroup])],
  controllers: [ProductGroupController],
  providers: [ProductGroupService],
})
export class ProductGroupModule {}
