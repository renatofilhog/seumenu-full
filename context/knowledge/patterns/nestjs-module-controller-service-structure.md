# Pattern: NestJS Module Controller Service Structure

## Description
Backend domains are organized into NestJS modules with controllers for HTTP boundaries and services for business logic, usually backed by TypeORM repositories.

## When to Use
Use this pattern when adding or extending a backend domain capability that should align with the existing NestJS project structure.

## Pattern
Place route definitions in a controller, keep orchestration and validation in a service, and register the domain through a dedicated module imported by `AppModule`.

## Example
```ts
@Module({
  imports: [
    UserModule,
    RoleModule,
    PermissionModule,
    ProductGroupModule,
    ProductModule,
    AdditionalModule,
  ],
})
export class AppModule implements NestModule {}
```

```ts
@Injectable()
export class PedidoService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
  ) {}
}
```

## Files Using This Pattern
- `erpfood-back/src/app.module.ts` - Composes the application from domain modules
- `erpfood-back/src/pedido/pedido.service.ts` - Business logic with repository-backed service
- `erpfood-back/src/product/product.controller.ts` - HTTP boundary for a single domain

## Related
- [Decision: Tech Stack](../../decisions/001-tech-stack.md)
- [Feature: Order Tracking](../../intent/feature-order-tracking.md)
- [Feature: SaaS Client Administration](../../intent/feature-saas-client-administration.md)

## Status
- **Created**: 2026-03-13
- **Status**: Active

