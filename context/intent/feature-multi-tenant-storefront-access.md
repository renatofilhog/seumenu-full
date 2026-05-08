# Feature: Multi-Tenant Storefront Access

## What
The platform serves the correct restaurant context based on the incoming access context so each restaurant has its own isolated storefront and operational space.

## Why
This allows one platform to support multiple restaurant clients without mixing identities, branding, or operational data.

## Acceptance Criteria
- [ ] A restaurant context can be resolved before tenant-specific operations are performed
- [ ] Public and authenticated flows operate against the correct restaurant context
- [ ] Tenant context remains isolated between different restaurant clients

## Related
- [Project Intent](project-intent.md)
- [Decision: Multi-Tenant Resolution Model](../decisions/002-multi-tenant-resolution-model.md)
- [Decision: Authentication and Permissions Model](../decisions/003-authentication-and-permissions-model.md)
- [Pattern: Tenant-Aware API Requests](../knowledge/patterns/tenant-aware-api-requests.md)
- [Pattern: Permission-Guarded Tenant Endpoints](../knowledge/patterns/permission-guarded-tenant-endpoints.md)

## Status
- **Created**: 2026-03-13 (Phase: Intent)
- **Status**: Active (already implemented)

