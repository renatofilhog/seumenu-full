# Project Intent: Seu Menu Platform

## What
Seu Menu is a restaurant platform that combines a public digital menu, table-based ordering, an operations panel for restaurant staff, and a SaaS administration area for managing client tenants.

## Why
The project exists to let restaurants publish their menu online, receive and track in-house orders more efficiently, and operate within a managed multi-tenant SaaS platform.

## Current State
The codebase already contains a working split between:
- A customer-facing Next.js application for browsing products, building orders, and following order progress
- A NestJS backend that exposes tenant-aware APIs for catalog, ordering, store configuration, authentication, files, and administration
- A SaaS management surface for onboarding and operating multiple restaurant tenants
- Containerized deployment with PostgreSQL, Nginx, and object storage integration

## Current Features
- Multi-tenant storefront access
- Digital menu browsing
- Cart and table ordering
- Order tracking
- Restaurant operations panel
- SaaS client administration
- Media and file handling

## Status
- **Created**: 2026-03-13 (Phase: Intent)
- **Status**: Active
- **Note**: Generated from existing codebase analysis

