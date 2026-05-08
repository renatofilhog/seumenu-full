# Decision: Tech Stack

## Context
The codebase contains two TypeScript applications with separate package manifests, container build files, and environment-driven runtime configuration. The project needs a customer-facing web application, an operational backend API, and production deployment support.

## Decision
Use:
- Next.js App Router with React for the frontend application
- NestJS with TypeORM for the backend API
- PostgreSQL as the primary database
- Docker Compose with Nginx for deployment orchestration

## Rationale
Rationale not documented in existing codebase, inferred from implementation.

The current stack suggests a preference for:
- A single React-based frontend with server-capable routing
- A modular backend framework with decorators, guards, and Swagger support
- A relational database suited to tenant-scoped operational data
- Containerized deployment that can run frontend, backend, proxy, and database together

## Alternatives Considered
Alternatives not documented in existing codebase.

Potential alternatives that were not selected include:
- A separate SPA plus API gateway instead of Next.js App Router
- Prisma or Knex-only data access instead of TypeORM repositories
- Managed platform-only deployment instead of Docker plus Nginx

## Outcomes
Outcomes to be documented as project evolves.

## Related
- [Project Intent](../intent/project-intent.md)
- [Feature: Digital Menu Browsing](../intent/feature-digital-menu-browsing.md)
- [Feature: SaaS Client Administration](../intent/feature-saas-client-administration.md)
- [Decision: Multi-Tenant Resolution Model](002-multi-tenant-resolution-model.md)

## Status
- **Created**: 2026-03-13 (Phase: Intent)
- **Status**: Accepted
- **Note**: Documented from existing implementation

