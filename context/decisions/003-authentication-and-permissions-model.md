# Decision: Authentication and Permissions Model

## Context
The system includes at least two administrative surfaces: a restaurant operations panel and a SaaS administration area. Backend endpoints also protect mutation operations and staff workflows.

## Decision
Use JWT-based authentication with separate application scopes and permission-based authorization for protected operations.

## Rationale
Rationale not documented in existing codebase, inferred from implementation.

The implementation shows a technical preference for:
- Signed JWT access tokens for authenticated sessions
- Separate auth scopes for restaurant users and SaaS management users
- Permission lists embedded in user context and enforced through guards
- Redirect-based recovery when frontend requests receive unauthorized responses

## Alternatives Considered
Alternatives not documented in existing codebase.

Potential alternatives that were not selected include:
- Session-only authentication
- Role-only authorization without granular permissions
- A single undifferentiated admin surface for both restaurant and SaaS users

## Outcomes
Outcomes to be documented as project evolves.

## Related
- [Project Intent](../intent/project-intent.md)
- [Feature: Multi-Tenant Storefront Access](../intent/feature-multi-tenant-storefront-access.md)
- [Feature: Restaurant Operations Panel](../intent/feature-restaurant-operations-panel.md)
- [Feature: SaaS Client Administration](../intent/feature-saas-client-administration.md)
- [Feature: Media and File Handling](../intent/feature-media-and-file-handling.md)
- [Decision: Multi-Tenant Resolution Model](002-multi-tenant-resolution-model.md)

## Status
- **Created**: 2026-03-13 (Phase: Intent)
- **Status**: Accepted
- **Note**: Documented from existing implementation

