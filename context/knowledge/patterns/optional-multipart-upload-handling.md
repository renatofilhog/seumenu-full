# Pattern: Optional Multipart Upload Handling

## Description
Endpoints that can receive either plain JSON or multipart form data use an interceptor and DTO normalization step so the same route can support file and non-file submissions.

## When to Use
Use this pattern when an API must accept an uploaded file optionally, without forcing every client to send multipart requests.

## Pattern
Apply an interceptor that only activates for multipart requests, then normalize string form fields into the DTO shape expected by the service layer.

## Example
```ts
@UseInterceptors(
  OptionalFileInterceptor('imagem', {
    storage: memoryStorage(),
    limits: { fileSize: maxFileSize },
  }),
)
```

```ts
if (payload.ativo !== undefined && typeof payload.ativo === 'string') {
  payload.ativo = payload.ativo === 'true' || payload.ativo === '1';
}
```

## Files Using This Pattern
- `erpfood-back/src/common/interceptors/optional-file.interceptor.ts` - Conditional multipart interceptor
- `erpfood-back/src/product/product.controller.ts` - Product creation and update with optional image upload
- `erpfood-back/src/files/files.controller.ts` - Dedicated file upload flow using in-memory multipart handling

## Related
- [Decision: Object Storage for Media Assets](../../decisions/004-object-storage-for-media-assets.md)
- [Feature: Media and File Handling](../../intent/feature-media-and-file-handling.md)
- [Feature: Cart and Table Ordering](../../intent/feature-cart-and-table-ordering.md)

## Status
- **Created**: 2026-03-13
- **Status**: Active

