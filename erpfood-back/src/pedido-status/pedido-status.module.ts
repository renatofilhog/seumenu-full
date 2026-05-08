import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { PedidoStatusEntity } from './entities/pedido-status.entity';
import { PedidoStatusController } from './pedido-status.controller';
import { PedidoStatusService } from './pedido-status.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, PedidoStatusEntity])],
  controllers: [PedidoStatusController],
  providers: [PedidoStatusService],
  exports: [PedidoStatusService],
})
export class PedidoStatusModule {}
