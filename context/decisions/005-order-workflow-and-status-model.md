# Decision: Order Workflow and Status Model

## Context
The platform supports customer ordering and back-of-house order handling. Both customer-facing order tracking and staff-facing operational updates depend on a shared workflow state model.

## Decision
Represent order progress with explicit status records and update flows that both customer and staff interfaces can consume.

## Rationale
Rationale not documented in existing codebase, inferred from implementation.

The implementation indicates a deliberate approach where:
- Orders start in a defined initial state
- Status changes are handled centrally in the backend
- Customer order tracking and staff workflows read from the same status model
- Operational interfaces can move orders forward without redefining the workflow per screen

## Alternatives Considered
Alternatives not documented in existing codebase.

Potential alternatives that were not selected include:
- Free-form status strings without a shared reference model
- Separate status workflows for customer and staff interfaces
- Client-side status simulation without backend state control

## Outcomes
Outcomes to be documented as project evolves.

## Related
- [Project Intent](../intent/project-intent.md)
- [Feature: Cart and Table Ordering](../intent/feature-cart-and-table-ordering.md)
- [Feature: Order Tracking](../intent/feature-order-tracking.md)
- [Feature: Restaurant Operations Panel](../intent/feature-restaurant-operations-panel.md)

## Status
- **Created**: 2026-03-13 (Phase: Intent)
- **Status**: Accepted
- **Note**: Documented from existing implementation

