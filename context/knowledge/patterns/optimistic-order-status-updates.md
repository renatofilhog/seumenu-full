# Pattern: Optimistic Order Status Updates

## Description
The operations panel updates the local order board immediately when staff move an order between stages, then confirms the change with the backend and rolls back if the request fails.

## When to Use
Use this pattern in staff-facing operational screens where fast interaction matters and the backend update can be confirmed shortly after the UI changes.

## Pattern
Copy the current board state, update the UI optimistically, send the mutation request, and revert to the previous state if the server rejects the change.

## Example
```ts
const previousKanban = kanbanState;
setKanbanState((prev) => {
  const next = prev.map((column) => ({
    ...column,
    pedidos: [...column.pedidos],
  }));
  const fromColumn = next.find((col) => col.status === fromStatus);
  const toColumn = next.find((col) => col.status === toStatus);
  if (!fromColumn || !toColumn) return prev;
  const index = fromColumn.pedidos.findIndex((p) => p.id === pedidoId);
  if (index < 0) return prev;
  const [pedido] = fromColumn.pedidos.splice(index, 1);
  pedido.status = toStatus;
  toColumn.pedidos.unshift(pedido);
  return next;
});
```

## Files Using This Pattern
- `seumenu-front/app/painel/pedido/PedidoClient.tsx` - Optimistic drag-and-drop status transitions in the operations panel
- `erpfood-back/src/pedido/pedido.service.ts` - Central backend status update handling
- `erpfood-back/src/pedido-status/pedido-status.service.ts` - Emits status changes used by the order workflow

## Related
- [Decision: Order Workflow and Status Model](../../decisions/005-order-workflow-and-status-model.md)
- [Feature: Order Tracking](../../intent/feature-order-tracking.md)
- [Feature: Restaurant Operations Panel](../../intent/feature-restaurant-operations-panel.md)

## Status
- **Created**: 2026-03-13
- **Status**: Active

