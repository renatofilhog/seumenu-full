# Feature: Cart and Table Ordering

## What
Customers can build an order, associate it with a table when needed, and submit that order to the restaurant.

## Why
This reduces ordering friction at the table and supports a QR-driven dine-in flow that can shorten service time and improve order accuracy.

## Acceptance Criteria
- [ ] Customers can add and remove items from a cart
- [ ] A table can be associated with an order flow
- [ ] An order can be submitted with selected items and relevant order details
- [ ] Recent table activity can influence how a new order is handled

## Related
- [Project Intent](project-intent.md)
- [Decision: Order Workflow and Status Model](../decisions/005-order-workflow-and-status-model.md)
- [Decision: Multi-Tenant Resolution Model](../decisions/002-multi-tenant-resolution-model.md)
- [Pattern: Session-Persisted Customer State](../knowledge/patterns/session-persisted-customer-state.md)
- [Pattern: Optional Multipart Upload Handling](../knowledge/patterns/optional-multipart-upload-handling.md)

## Status
- **Created**: 2026-03-13 (Phase: Intent)
- **Status**: Active (already implemented)

