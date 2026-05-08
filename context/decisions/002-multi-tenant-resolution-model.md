# Decision: Multi-Tenant Resolution Model

## Context
The platform serves multiple restaurant clients and must determine which tenant a request belongs to before loading data or authorizing user actions. Both public menu access and authenticated application flows depend on consistent tenant resolution.

## Decision
Resolve tenant context through a layered model that can derive the tenant from context cookies, explicit slug headers, domains, subdomains, or authenticated user tokens.

## Rationale
Rationale not documented in existing codebase, inferred from implementation.

The implementation indicates that tenant resolution needs to support:
- Public storefront access before authentication
- Multiple tenant entry points such as hostnames and slugs
- Authenticated fallback when explicit host context is unavailable
- Reusable tenant context across requests

## Alternatives Considered
Alternatives not documented in existing codebase.

Reasonable alternatives that were not chosen include:
- Tenant resolution only by subdomain
- Tenant resolution only from authenticated user membership
- Separate deployments per restaurant instead of a shared multi-tenant platform

## Outcomes
Outcomes to be documented as project evolves.

## Related
- [Project Intent](../intent/project-intent.md)
- [Feature: Multi-Tenant Storefront Access](../intent/feature-multi-tenant-storefront-access.md)
- [Feature: Digital Menu Browsing](../intent/feature-digital-menu-browsing.md)
- [Feature: SaaS Client Administration](../intent/feature-saas-client-administration.md)
- [Decision: Authentication and Permissions Model](003-authentication-and-permissions-model.md)

## Status
- **Created**: 2026-03-13 (Phase: Intent)
- **Status**: Accepted
- **Note**: Documented from existing implementation

