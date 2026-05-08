import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MesaController } from './mesa.controller';
import { MesaService } from './mesa.service';
import { Mesa } from './entities/mesa.entity';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { Store } from 'src/store/entities/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mesa, Pedido, Store])],
  controllers: [MesaController],
  providers: [MesaService],
})
export class MesaModule {}
