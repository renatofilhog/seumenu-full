# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Each app has its own `package.json`; run commands from the respective directory.

**Backend (`erpfood-back/`):**
```bash
npm run start:dev     # dev server with watch mode
npm run start:debug   # debug mode
npm run build         # TypeScript compilation
npm run test:e2e      # end-to-end tests
npm run lint          # ESLint with auto-fix
npm run format        # Prettier
```

**Frontend (`seumenu-front/`):**
```bash
npm run dev     # dev server
npm run build   # production build
npm run lint    # ESLint
```

**Full stack:**
```bash
docker compose up --build   # production-like (frontend + backend + postgres + nginx)
```

## Architecture

Multi-tenant restaurant SaaS with two TypeScript apps sharing no workspace config.

```
seumenu-front/  (Next.js 16 App Router, React 19, Tailwind CSS 4)
  app/
    loja/[slug]/      # public storefront entry point — resolves tenant by URL slug
    cliente/          # customer-facing menu, cart, order tracking
    produto/[id]/     # product detail
    painel/           # restaurant operations panel (staff login, orders, menu mgmt)
    smmanageapps/     # SaaS admin surface (onboarding, managing tenants)
    components/       # shared UI (cliente/, dashboard/, shared/)
    lib/api.ts        # single fetch wrapper — injects auth token + x-tenant-host header

erpfood-back/  (NestJS 11, TypeORM, PostgreSQL 16)
  src/
    auth/           # JWT strategy, guards, permission enforcement
    tenant/         # tenant entity + resolution middleware
    product/        # catalog (product groups → products → additionals)
    pedido/         # orders; pedido-item, pedido-status sub-modules
    mesa/           # table management
    user/ role/ permission/  # RBAC
    saas/           # SaaS-level operations
    storage/        # S3-compatible file upload
    audit/          # change tracking
    license/        # tenant licensing
    common/         # shared utilities
```

### Multi-Tenancy

Tenant resolved from: cookie → slug header → domain/subdomain → JWT user claim (layered, not subdomain-only). Every backend mutation must call `resolveTenantId(req)` before the service layer.

### Authentication & Permissions

Two JWT scopes: `app` (restaurant staff) and `saas` (platform admin). Protected endpoints use `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@Permissions('resource.action')`. Frontend detects 401 responses and redirects to login.

### Frontend API Pattern

All requests go through `app/lib/api.ts`. It injects `Authorization: Bearer <token>` and `x-tenant-host` (from `window.location.host`) automatically. Never call `fetch` directly for app data.

## Context Mesh

The `context/` directory is the authoritative source of project decisions and patterns:

- `context/intent/` — feature intents and project goals
- `context/decisions/` — recorded architectural decisions (ADRs)
- `context/knowledge/patterns/` — implementation patterns to follow
- `context/knowledge/anti-patterns/` — patterns to avoid
- `context/evolution/changelog.md` — change log

**Before implementing anything non-trivial:** read relevant files from `context/intent/` and `context/decisions/`.

**After any implementation change:** update `context/evolution/changelog.md` and any affected intent or decision files. Add a new pattern file if implementation guidance materially changed.

## Code Style

- Backend: single quotes, trailing commas (Prettier enforced).
- Frontend: ESLint defaults (Next.js config).
- New backend domains follow module → controller → service → TypeORM repository structure; register in `AppModule`.
- Do not bypass permission guards on mutation endpoints.
