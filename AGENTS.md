# AGENTS.md

## Setup Commands
- Install: `cd seumenu-front && npm install` and `cd erpfood-back && npm install`
- Dev: `cd erpfood-back && npm run start:dev` and `cd seumenu-front && npm run dev`
- Test: `cd erpfood-back && npm run test:e2e`
- Build: `cd erpfood-back && npm run build` and `cd seumenu-front && npm run build`
- Full stack (production-like): `docker compose up --build`

## Code Style
- TypeScript across frontend and backend; keep strict typing where the repo already enforces it.
- Frontend follows Next.js App Router conventions under `seumenu-front/app/` with client components for interactive screens.
- Backend follows NestJS module/controller/service organization under `erpfood-back/src/`.
- Backend formatting uses single quotes and trailing commas; frontend follows the repository ESLint defaults.
- Protected backend endpoints use JWT plus permission checks; tenant-aware behavior must be preserved.
- Follow patterns from `@context/knowledge/patterns/`.

## Context Files to Load

Before starting any work, load relevant context:
- @context/intent/project-intent.md
- @context/intent/feature-*.md
- @context/decisions/*.md
- @context/knowledge/patterns/*.md

## Project Structure
root/
├── AGENTS.md
├── context/
│   ├── intent/
│   ├── decisions/
│   ├── knowledge/
│   ├── agents/
│   └── evolution/
├── seumenu-front/
├── erpfood-back/
├── nginx/
└── docker-compose.yml

## AI Agent Rules

### Always
- Load context before implementing.
- Follow decisions from @context/decisions/.
- Use patterns from @context/knowledge/patterns/.
- Update context after any changes.
- Preserve the split between feature intent, technical decisions, and implementation patterns.

### Never
- Put library choices or file-level implementation details into feature files.
- Ignore documented decisions.
- Use anti-patterns from @context/knowledge/anti-patterns/.
- Leave context stale after changes.

### After Any Changes (Critical)
AI must update Context Mesh after changes:
- Update relevant feature intent if functionality changed.
- Add outcomes to decision files if the approach changed or new evidence appeared.
- Update `context/evolution/changelog.md`.
- Create new pattern or anti-pattern files when implementation guidance materially changes.

## Definition of Done (Build Phase)

Before completing any implementation:
- [ ] Relevant context files reviewed
- [ ] Decision exists before new technical direction is introduced
- [ ] Code follows documented patterns
- [ ] Decisions respected
- [ ] Tests or verification appropriate to the change completed
- [ ] Context updated to reflect changes
- [ ] Changelog updated

