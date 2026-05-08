# Copilot Instructions

## Project Overview

SeúMenu is a **multi-tenant SaaS ERP system for restaurant management**. It has two workspaces:

- **`erpfood-back/`** — NestJS 11 (TypeScript) backend API
- **`seumenu-front/`** — Next.js 16 (TypeScript, App Router) frontend

---

## Backend (`erpfood-back/`)

### Commands

```bash
npm run start:dev        # Development with watch mode
npm run build            # Compile TypeScript via nest build
npm run lint             # ESLint with --fix
npm run format           # Prettier on src/**/*.ts and test/**/*.ts
npm run test             # Jest unit tests
npm run test -- --testPathPattern=user  # Run a single test file by pattern
npm run test:e2e         # E2E tests (requires running Postgres)
```

Local Postgres: `docker-compose -f docker-compose-pg.yml up -d`

### Architecture

The backend is a standard NestJS monolith where **each domain is a self-contained NestJS module** (`module`, `controller`, `service`, `entity`, `dto` files in one folder). Key domains:

- `tenant/` — Multi-tenant resolution via slug or custom domain. `TenantResolutionMiddleware` populates `req.tenant` on every request. All other modules use this to scope data.
- `auth/` — JWT (Passport `passport-jwt`). Two auth scopes: `app` (restaurant staff) and `saas` (platform admin via `SaasManagementModule`).
- `license/` — `LicenseAccessGuard` is applied globally and gates access based on active license per tenant.
- `storage/` — Wraps AWS S3 / MinIO behind a `StorageService`. Presigned URLs are used for public file access. Configured via `STORAGE_PROVIDER` and `S3_*` env vars.
- `saas/` + `tenant-admin/` — Super-admin features for provisioning new tenants and managing subscriptions.

**Guards applied globally (in `app.module.ts`):**
1. `TenantAccessGuard` — enforces tenant isolation
2. `LicenseAccessGuard` — enforces active license

### Conventions

- **Naming**: Domain modules use Portuguese names where they map to restaurant domain concepts: `pedido` (order), `mesa` (table), `produto` (product), `adicional` (add-on). Keep this naming.
- **Database**: TypeORM entities are auto-loaded from `src/**/*.entity.ts`. Never use `DB_SYNC=true` in production — use Knex migrations in `migrations/`.
- **DTOs**: Use `class-validator` decorators on all DTO classes. Entities and DTOs are kept separate.
- **Tests**: Unit tests are colocated as `*.spec.ts`; e2e tests live in `test/` as `*.e2e-spec.ts`.
- **Commit messages**: Short, imperative, **in Portuguese** (e.g., `"Cria CRUD de Users e Roles"`).

### Environment Variables

Required in `.env` (see `.env.sample`):

```
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SYNC
JWT_SECRET, JWT_EXPIRES_IN
STORAGE_PROVIDER, S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET
CORS_ORIGIN
TENANT_SLUG_BASE_HOSTS
```

---

## Frontend (`seumenu-front/`)

### Commands

```bash
npm run dev     # Dev server at http://localhost:3000
npm run build   # Production build
npm run lint    # ESLint
```

### Architecture

Three distinct user-facing sections under `app/`:

| Path | Purpose | Auth |
|------|---------|------|
| `/painel/` | Restaurant staff admin panel | `seumenu_access_token` cookie (app scope) |
| `/cliente/[tenant]/` | Customer-facing menu & ordering | Public / no auth |
| `/smmanageapps/` | SaaS super-admin panel | `seumenu_saas_access_token` cookie (saas scope) |

**All API calls go through `app/lib/api.ts`:**

- `apiGet<T>(path, token?, scope?)` / `apiPost<TRes, TBody>(path, body, token?, scope?)`
- Automatically adds `Authorization: Bearer` from the appropriate cookie
- Adds `x-tenant-host` and `x-tenant-slug` headers for multi-tenant routing
- 401 responses automatically redirect to the relevant login page

**API base URL** is hardcoded in `app/lib/api.ts`:
```ts
export const API_BASE_URL = "https://app.alluredev.com.br";
```

### Conventions

- **No global state library** — state lives in component `useState`, cookies (`js-cookie`-style), and `localStorage`/`sessionStorage`.
- **Styling**: Tailwind CSS v4 with `@tailwindcss/postcss`. No component library (custom components only).
- **Tenant context in frontend**: The current tenant slug is parsed from the URL (`/cliente/[tenant]/`) or stored in a cookie for the admin panel session.
- **QR codes**: Generated with the `qrcode` package for table-level customer access links.
- **No test suite** in the frontend currently.

---

## Multi-Tenancy Flow (End-to-End)

1. Customer accesses `/{slug}/menu` or a custom domain.
2. Frontend sends `x-tenant-slug` (or `x-tenant-host`) header with every API request.
3. Backend `TenantResolutionMiddleware` resolves the `Tenant` record and attaches it to `req.tenant`.
4. Services use `req.tenant.id` to scope all database queries.
5. `TenantAccessGuard` blocks requests where tenant resolution fails on protected routes.
