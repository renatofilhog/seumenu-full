import { Subject, firstValueFrom, take } from 'rxjs';
import { PedidoController } from './pedido.controller';
import { PedidoEvent } from './types/pedido-event.type';

describe('PedidoController', () => {
  it('streams only pedido events from the authenticated tenant', async () => {
    const subject = new Subject<PedidoEvent>();
    const controller = new PedidoController({
      getPedidoEvents: () => subject.asObservable(),
    } as any);

    const stream = controller.streamEvents({
      user: { tenantId: 99 },
    } as any);

    const eventPromise = firstValueFrom(stream.pipe(take(1)));

    subject.next({
      type: 'created',
      pedido: { id: 1, tenantId: 55 } as any,
    });
    subject.next({
      type: 'created',
      pedido: { id: 2, tenantId: 99 } as any,
    });

    await expect(eventPromise).resolves.toEqual({
      data: {
        type: 'created',
        pedido: { id: 2, tenantId: 99 },
      },
    });
  });

  it('streams public status events only for the requested pedido inside the tenant', async () => {
    const subject = new Subject<PedidoEvent>();
    const controller = new PedidoController({
      getPedidoEvents: () => subject.asObservable(),
      findByIdOrNumero: jest.fn().mockResolvedValue({
        id: 20,
        numero: 1020,
        tenantId: 15,
        status: { id: 3 },
      }),
    } as any);

    const stream = await controller.streamStatusEvents("1020", {
      tenant: { id: 15 },
    } as any);

    const eventPromise = firstValueFrom(stream.pipe(take(1)));

    subject.next({
      type: 'updated',
      pedido: { id: 21, numero: 1021, tenantId: 15, status: { id: 2 } } as any,
    });
    subject.next({
      type: 'updated',
      pedido: { id: 20, numero: 1020, tenantId: 15, status: { id: 4 } } as any,
    });

    await expect(eventPromise).resolves.toEqual({
      data: {
        pedidoId: 20,
        numero: 1020,
        statusId: 4,
        type: 'updated',
      },
    });
  });
});
