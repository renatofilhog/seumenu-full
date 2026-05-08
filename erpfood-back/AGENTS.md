# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the NestJS app (modules, controllers, services) and `src/main.ts` bootstrap.
- Domain modules live under `src/` (e.g., `src/user/`, `src/role/`, `src/permission/`).
- Database config is in `src/database/` (TypeORM), and database migrations live in `migrations/`.
- Unit tests are colocated in `src/**/**.spec.ts`; e2e tests live in `test/` (e.g., `*.e2e-spec.ts`).
- Build output goes to `dist/`.

## Build, Test, and Development Commands
- `npm run start`: run the app in standard mode.
- `npm run start:dev`: run with watch mode for local development.
- `npm run start:prod`: run the compiled output from `dist/`.
- `npm run build`: compile the TypeScript code via Nest build.
- `npm run lint`: run ESLint with `--fix`.
- `npm run format`: format `src/**/*.ts` and `test/**/*.ts` with Prettier.
- `npm run test`: run Jest unit tests.
- `npm run test:e2e`: run e2e tests with `test/jest-e2e.json`.

## Coding Style & Naming Conventions
- Language: TypeScript with NestJS conventions (Module/Service/Controller classes).
- Formatting: Prettier enforced through ESLint (`eslint.config.mjs`).
- Indentation: 2 spaces (Prettier defaults).
- Test naming: unit tests use `*.spec.ts`; e2e tests use `*.e2e-spec.ts`.

## Testing Guidelines
- Frameworks: Jest for unit tests; Supertest for e2e tests.
- Keep unit tests close to the code under `src/`.
- Prefer descriptive test names that reflect behavior (e.g., “creates a role with permissions”).

## Commit & Pull Request Guidelines
- Commit messages are short, imperative, and in Portuguese (e.g., “Cria CRUD de Users e Roles”).
- Keep commits focused; include migrations and schema changes in the same commit when applicable.
- PRs should include a clear description, how to test, and any DB/migration notes.

## Environment & Configuration Tips
- Postgres settings are required: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SYNC`.
- For local Postgres, use `docker-compose -f docker-compose-pg.yml up -d`.
- Ensure env vars are loaded before booting the app (e.g., ConfigModule or dotenv).
