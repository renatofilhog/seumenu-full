import { firstValueFrom, take } from 'rxjs';
import { PedidoService } from './pedido.service';

describe('PedidoService', () => {
  function createService() {
    return new PedidoService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { emitStatusUpdate: jest.fn() } as any,
    );
  }

  it('emits tenant-scoped pedido events through the shared observable', async () => {
    const service = createService();
    const expected = {
      type: 'created' as const,
      pedido: { id: 10, tenantId: 22, numero: 101 } as any,
    };

    const eventPromise = firstValueFrom(service.getPedidoEvents().pipe(take(1)));

    service.emitPedidoEvent(expected.type, expected.pedido);

    await expect(eventPromise).resolves.toEqual(expected);
  });
});
