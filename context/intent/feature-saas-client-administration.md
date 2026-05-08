# Feature: SaaS Client Administration

## What
Platform administrators can manage restaurant clients and access a dedicated SaaS management area for onboarding and operating tenant accounts.

## Why
The platform needs an internal management surface so the SaaS operator can add, configure, and support multiple restaurant customers at scale.

## Acceptance Criteria
- [ ] SaaS administrators can sign in to a separate management area
- [ ] SaaS client records and related operational data can be viewed and updated
- [ ] Administrative actions are controlled separately from restaurant staff access

## Related
- [Project Intent](project-intent.md)
- [Decision: Authentication and Permissions Model](../decisions/003-authentication-and-permissions-model.md)
- [Decision: Multi-Tenant Resolution Model](../decisions/002-multi-tenant-resolution-model.md)
- [Pattern: Tenant-Aware API Requests](../knowledge/patterns/tenant-aware-api-requests.md)
- [Pattern: NestJS Module Controller Service Structure](../knowledge/patterns/nestjs-module-controller-service-structure.md)

## Status
- **Created**: 2026-03-13 (Phase: Intent)
- **Status**: Active (already implemented)

