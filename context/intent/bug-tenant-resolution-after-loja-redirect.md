# Bug: Tenant Resolution After `/loja/{slug}` Redirect

## What
In production, accessing `/loja/{slug}` completes the initial tenant context setup flow but fails to preserve or reuse that tenant context after redirecting to `/`.

After the redirect, the application shows "restaurante nao disponivel" and subsequent tenant-aware requests fail because the tenant is no longer resolved.

## Why
This bug blocks the tenant-specific storefront from loading correctly in production and prevents the selected restaurant context from being used in the public menu and panel flows.

## Expected Behavior
- [ ] Accessing `/loja/{slug}` resolves the tenant for the provided slug
- [ ] The tenant context token is generated and stored successfully
- [ ] The user is redirected to `/`
- [ ] Subsequent requests resolve the same tenant correctly
- [ ] The storefront and panel load without showing restaurant unavailability

## Actual Behavior
- [ ] Accessing `/loja/{slug}` redirects correctly to `/`
- [ ] Initial tenant context creation appears to succeed
- [ ] The application then shows "restaurante nao disponivel"
- [ ] The request to `/tenant/resolve` fails with `404 Tenant nao encontrado para o contexto informado`
- [ ] The failure happens in AWS but not in local development

## Impact
- **Severity**: High
- **Affected Feature**: [Feature: Multi-Tenant Storefront Access](feature-multi-tenant-storefront-access.md)

## Suspected Cause
Probable production-only tenant resolution failure caused by differences in host, header, cookie, proxy, or domain behavior between local and AWS environments.

## Implementation Note
The current fix updates the `/loja/{slug}` bootstrap route to derive a shared cookie domain automatically from the app host and API host when an explicit cookie domain is not configured. This is intended to make the tenant context cookie available to both frontend and API subdomains in production.

## Related
- [Project Intent](project-intent.md)
- [Feature: Multi-Tenant Storefront Access](feature-multi-tenant-storefront-access.md)
- [Decision: Multi-Tenant Resolution Model](../decisions/002-multi-tenant-resolution-model.md)
- [Decision: Authentication and Permissions Model](../decisions/003-authentication-and-permissions-model.md)
- [Pattern: Tenant-Aware API Requests](../knowledge/patterns/tenant-aware-api-requests.md)

## Status
- **Created**: 2026-03-13 (Phase: Intent)
- **Status**: Fix implemented, awaiting production verification
- **Note**: No decision file added; fix stays within the existing tenant context approach
