# Changelog

## [Current State] - Context Mesh Added

### Existing Features (documented)
- Multi-tenant storefront access - tenant-aware restaurant context resolution across public and authenticated flows
- Digital menu browsing - customer-facing catalog with highlights and categories
- Cart and table ordering - dine-in order building with table association
- Order tracking - customer and staff visibility into order progress
- Restaurant operations panel - staff-facing management for operational workflows
- SaaS client administration - separate management area for tenant operations
- Media and file handling - upload and delivery of menu and store assets

### Tech Stack (documented)
- Next.js 16 with React 19
- NestJS 11 with TypeORM
- PostgreSQL
- Docker Compose and Nginx
- S3-compatible object storage
- JWT authentication with permission-based authorization

### Patterns Identified
- Tenant-aware API requests
- Session-persisted customer state
- Permission-guarded tenant endpoints
- Optional multipart upload handling
- NestJS module controller service structure
- Optimistic order status updates

---
*Context Mesh added: 2026-03-13*
*This changelog documents the state when Context Mesh was added.*
*Future changes will be tracked below.*

## [2026-03-13] - Bug Documented

### Bugs Documented
- Tenant resolution after `/loja/{slug}` redirect fails in AWS production, causing `/tenant/resolve` to return 404 and the storefront to show restaurant unavailability

### Affected Area
- Multi-tenant storefront access

### Notes
- Root cause not yet confirmed
- No new decision file created yet because the fix approach has not been approved

## [2026-03-13] - Bug Fix Implemented

### Fixes
- Updated the `/loja/{slug}` tenant bootstrap flow to derive a shared cookie domain automatically between app and API hosts when no explicit tenant cookie domain is configured
- Updated tenant context cookie cleanup to use the same domain scope as cookie creation

### Affected Area
- Multi-tenant storefront access

### Verification
- Local code change completed
- Production verification still required in AWS
