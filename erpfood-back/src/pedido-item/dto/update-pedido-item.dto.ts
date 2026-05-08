import { PartialType } from '@nestjs/mapped-types';
import { CreatePedidoItemDto } from './create-pedido-item.dto';

export class UpdatePedidoItemDto extends PartialType(CreatePedidoItemDto) {}
