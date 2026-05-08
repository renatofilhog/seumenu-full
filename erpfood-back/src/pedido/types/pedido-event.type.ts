import { Pedido } from '../entities/pedido.entity';

export type PedidoEventType = 'created' | 'updated';

export type PedidoEvent = {
  type: PedidoEventType;
  pedido: Pedido;
};
