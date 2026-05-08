# Pattern: Permission-Guarded Tenant Endpoints

## Description
Protected backend endpoints combine tenant resolution, JWT authentication, and permission metadata so requests are both authorized and scoped correctly.

## When to Use
Use this pattern for backend routes that mutate tenant-owned data or expose administrative operations.

## Pattern
Annotate the controller endpoint with guards and permission metadata, then resolve tenant context from the request before calling the service layer.

## Example
```ts
@Post()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('product.create')
async create(
  @Body() createProductDto: CreateProductDto,
  @UploadedFile() imagem?: Express.Multer.File,
  @Req() req?: ProductRequest,
) {
  const normalizedDto = this.normalizeMultipartDto(createProductDto);
  const tenantId = this.resolveTenantId(req);
  const imagemUrl = await this.resolveImagemUrl(normalizedDto.imagemUrl, imagem, 'products', tenantId);
  return this.productService.create({ ...normalizedDto, imagemUrl }, tenantId);
}
```

## Files Using This Pattern
- `erpfood-back/src/product/product.controller.ts` - Product mutations guarded by JWT and permissions
- `erpfood-back/src/mesa/mesa.controller.ts` - Table management protected by JWT and permissions
- `erpfood-back/src/auth/guards/permissions.guard.ts` - Central permission enforcement logic

## Related
- [Decision: Authentication and Permissions Model](../../decisions/003-authentication-and-permissions-model.md)
- [Decision: Multi-Tenant Resolution Model](../../decisions/002-multi-tenant-resolution-model.md)
- [Feature: Restaurant Operations Panel](../../intent/feature-restaurant-operations-panel.md)
- [Feature: Media and File Handling](../../intent/feature-media-and-file-handling.md)

## Status
- **Created**: 2026-03-13
- **Status**: Active

