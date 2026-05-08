# Pattern: Session-Persisted Customer State

## Description
The customer ordering flow persists cart, table, product, and order context in browser storage so the ordering journey survives navigation and short interruptions.

## When to Use
Use this pattern for customer-side state that must remain available across pages in the same ordering session without requiring a full authenticated account flow.

## Pattern
Load initial state from browser storage, keep React state as the interaction source of truth, and write back to storage when the state changes.

## Example
```ts
const initialCart = useMemo(() => loadCart(), []);
const [cartItems, setCartItems] = useState<CartItem[]>(
  initialCart?.items ?? [],
);

useEffect(() => {
  saveCart({ items: cartItems, mesa: mesa ?? undefined }, DEFAULT_CART_TTL_MINUTES);
}, [cartItems, mesa]);
```

## Files Using This Pattern
- `seumenu-front/app/components/cliente/CartClient.tsx` - Persists cart and table context
- `seumenu-front/app/components/cliente/OrderTrackingClient.tsx` - Persists recent order state for tracking
- `seumenu-front/app/components/cliente/ClienteHome.tsx` - Stores fetched products and selected table context

## Related
- [Decision: Order Workflow and Status Model](../../decisions/005-order-workflow-and-status-model.md)
- [Feature: Digital Menu Browsing](../../intent/feature-digital-menu-browsing.md)
- [Feature: Cart and Table Ordering](../../intent/feature-cart-and-table-ordering.md)

## Status
- **Created**: 2026-03-13
- **Status**: Active

