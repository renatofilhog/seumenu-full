import { PedidoStatusService } from './pedido-status.service';

describe('PedidoStatusService', () => {
  function createService(deps?: {
    pedidoFind?: jest.Mock;
    pedidoFindOne?: jest.Mock;
    pedidoSave?: jest.Mock;
    statusFind?: jest.Mock;
    statusFindOne?: jest.Mock;
  }) {
    const pedidoRepository = {
      find: deps?.pedidoFind ?? jest.fn(),
      findOne: deps?.pedidoFindOne ?? jest.fn(),
      save: deps?.pedidoSave ?? jest.fn(),
    };
    const pedidoStatusRepository = {
      find: deps?.statusFind ?? jest.fn(),
      findOne: deps?.statusFindOne ?? jest.fn(),
    };

    return {
      service: new PedidoStatusService(
        pedidoRepository as any,
        pedidoStatusRepository as any,
      ),
      pedidoRepository,
      pedidoStatusRepository,
    };
  }

  it('filters kanban pedidos by tenant id', async () => {
    const pedidoFind = jest.fn().mockResolvedValue([
      { id: 1, tenantId: 10, status: { value: 'em_analise' } },
    ]);
    const statusFind = jest.fn().mockResolvedValue([
      { id: 1, value: 'em_analise' },
      { id: 2, value: 'preparando' },
    ]);
    const { service, pedidoRepository } = createService({
      pedidoFind,
      statusFind,
    });

    const kanban = await service.getKanban(10);

    expect(pedidoRepository.find).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId: 10 }),
      relations: ['mesa', 'itens', 'itens.produto', 'itens.additionals', 'status'],
      order: { data: 'DESC', numero: 'DESC' },
    }));
    expect(kanban).toEqual([
      { status: 'em_analise', pedidos: [{ id: 1, tenantId: 10, status: { value: 'em_analise' } }] },
      { status: 'preparando', pedidos: [] },
    ]);
  });

  it('does not expose cancelado as kanban column', async () => {
    const pedidoFind = jest.fn().mockResolvedValue([
      { id: 8, tenantId: 10, status: { value: 'cancelado' } },
    ]);
    const statusFind = jest.fn().mockResolvedValue([
      { id: 1, value: 'em_analise' },
      { id: 2, value: 'preparando' },
      { id: 3, value: 'feito' },
      { id: 4, value: 'cancelado' },
    ]);
    const { service } = createService({
      pedidoFind,
      statusFind,
    });

    const kanban = await service.getKanban(10);

    expect(kanban).toEqual([
      { status: 'em_analise', pedidos: [] },
      { status: 'preparando', pedidos: [] },
      { status: 'feito', pedidos: [] },
    ]);
  });

  it('updates status only for pedido inside the authenticated tenant', async () => {
    const pedido = { id: 7, tenantId: 15, status: { value: 'em_analise' } };
    const statusEntity = { id: 2, value: 'preparando' };
    const pedidoFindOne = jest
      .fn()
      .mockResolvedValueOnce(pedido)
      .mockResolvedValueOnce({ ...pedido, status: statusEntity });
    const pedidoSave = jest.fn().mockImplementation(async (value) => value);
    const statusFindOne = jest.fn().mockResolvedValue(statusEntity);
    const { service, pedidoRepository } = createService({
      pedidoFindOne,
      pedidoSave,
      statusFindOne,
    });

    const saved = await service.updateStatus(7, statusEntity.value as any, 15);

    expect(pedidoRepository.findOne).toHaveBeenNthCalledWith(1, {
      where: { id: 7, tenantId: 15 },
      relations: ['mesa', 'itens', 'itens.produto', 'itens.additionals', 'status'],
    });
    expect(saved).toEqual({ ...pedido, status: statusEntity });
  });

  it('returns null when trying to update pedido from another tenant', async () => {
    const pedidoFindOne = jest.fn().mockResolvedValue(null);
    const { service, pedidoRepository } = createService({
      pedidoFindOne,
    });

    const result = await service.updateStatus(7, 'preparando' as any, 99);

    expect(pedidoRepository.findOne).toHaveBeenCalledWith({
      where: { id: 7, tenantId: 99 },
      relations: ['mesa', 'itens', 'itens.produto', 'itens.additionals', 'status'],
    });
    expect(result).toBeNull();
  });
});
