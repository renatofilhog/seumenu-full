# Decision: Object Storage for Media Assets

## Context
The platform needs to store restaurant media and uploaded files while supporting public asset delivery and protected download scenarios across tenant-specific data.

## Decision
Use an S3-compatible object storage integration for media assets and file objects, with support for public URLs and presigned access.

## Rationale
Rationale not documented in existing codebase, inferred from implementation.

The current implementation suggests this approach was chosen to:
- Keep binary files outside the application filesystem
- Support tenant-scoped object keys
- Allow both public-read assets and controlled access flows
- Work cleanly in containerized deployments

## Alternatives Considered
Alternatives not documented in existing codebase.

Potential alternatives that were not selected include:
- Storing files only on the local server filesystem
- Persisting binary data directly in the database
- Using a single public CDN path without file metadata management

## Outcomes
Outcomes to be documented as project evolves.

## Related
- [Project Intent](../intent/project-intent.md)
- [Feature: Media and File Handling](../intent/feature-media-and-file-handling.md)
- [Feature: Digital Menu Browsing](../intent/feature-digital-menu-browsing.md)
- [Decision: Tech Stack](001-tech-stack.md)

## Status
- **Created**: 2026-03-13 (Phase: Intent)
- **Status**: Accepted
- **Note**: Documented from existing implementation

