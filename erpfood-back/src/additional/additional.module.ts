import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/product/entities/product.entity';
import { AdditionalController } from './additional.controller';
import { AdditionalService } from './additional.service';
import { Additional } from './entities/additional.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Additional, Product])],
  controllers: [AdditionalController],
  providers: [AdditionalService],
})
export class AdditionalModule {}
