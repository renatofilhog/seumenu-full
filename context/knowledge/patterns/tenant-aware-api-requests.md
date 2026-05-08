# Pattern: Tenant-Aware API Requests

## Description
Frontend API calls are centralized through a shared client that adds auth tokens, request defaults, and tenant context headers before making requests.

## When to Use
Use this pattern for frontend requests that need to work in the restaurant app or SaaS app while preserving the correct auth scope and tenant context.

## Pattern
Wrap `fetch` in a shared helper that:
- Injects the correct auth token by scope
- Applies default JSON headers
- Sends tenant host context for app requests
- Handles unauthorized responses consistently

## Example
```ts
export async function apiRequest<T>(
  path: string,
  options?: ApiRequestOptions,
): Promise<T> {
  const authScope = options?.authScope ?? "app";
  const authConfig = getAuthConfig(authScope);
  const token =
    options?.token === undefined ? getClientToken(authConfig.tokenCookie) : (options.token ?? null);
  const headers = new Headers(options?.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (typeof window !== "undefined" && authScope === "app") {
    const host = window.location.host;
    if (host && !headers.has("x-tenant-host")) {
      headers.set("x-tenant-host", host);
    }
  }
}
```

## Files Using This Pattern
- `seumenu-front/app/lib/api.ts` - Shared API client for app and SaaS scopes
- `seumenu-front/app/components/cliente/ClienteHome.tsx` - Public menu data loading through the shared client
- `seumenu-front/app/painel/login/page.tsx` - Authenticated panel login through the shared client

## Related
- [Decision: Multi-Tenant Resolution Model](../../decisions/002-multi-tenant-resolution-model.md)
- [Decision: Authentication and Permissions Model](../../decisions/003-authentication-and-permissions-model.md)
- [Feature: Multi-Tenant Storefront Access](../../intent/feature-multi-tenant-storefront-access.md)
- [Feature: Digital Menu Browsing](../../intent/feature-digital-menu-browsing.md)

## Status
- **Created**: 2026-03-13
- **Status**: Active

