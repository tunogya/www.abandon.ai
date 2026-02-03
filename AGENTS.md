# Repository Guidelines

## Project Structure & Module Organization
- `app/`: React Router 7 frontend (routes, components, hooks).
- `workers/api/`: Cloudflare Workers + Hono API (routes, services, middleware).
- `shared/`: Shared TypeScript types (`shared/types.ts` is the single source of truth).
- `public/`: Static assets served by the frontend.
- `migrations/` and `schema.sql`: D1 (SQLite) schema and migrations.
- `scripts/`: Local utilities and maintenance helpers.
- `build/`: Frontend build output (generated).

## Build, Test, and Development Commands
- `npm install`: Install dependencies and generate Cloudflare types (via `postinstall`).
- `npm run dev:api`: Run Workers API locally at `http://localhost:8787`.
- `npm run dev:frontend`: Run the React Router dev server at `http://localhost:5173`.
- `npm run build`: Production frontend build.
- `npm run preview`: Build and preview the frontend locally.
- `npm run typecheck`: Generate types and run TypeScript project checks.
- `npm run test`: Run Vitest unit tests.
- `npm run deploy:api` / `npm run deploy:frontend`: Deploy Workers API / Pages frontend.

## Coding Style & Naming Conventions
- TypeScript-first; keep shared API types in `shared/types.ts`.
- Indentation is 2 spaces in TS/TSX (match existing files). JSON uses tabs.
- Prefer explicit, descriptive names (e.g., `useGameStateRest`, `VirusList`).
- Follow React Router + Tailwind conventions already used in `app/`.

## Testing Guidelines
- Framework: Vitest (`vitest.config.ts`).
- Tests live alongside code, e.g., `workers/api/index.test.ts`.
- Run `npm run test` locally; use `npm run test:coverage` when changing core logic.

## Commit & Pull Request Guidelines
- Commits follow Conventional Commits (e.g., `feat:`, `fix:`, `refactor:`).
- PRs should include a clear description, linked issues if applicable, and UI screenshots for frontend changes.
- Call out API or schema changes explicitly (include migration notes).

## Configuration & Data Notes
- Worker config lives in `wrangler.jsonc`.
- D1 schema changes require updating `schema.sql` and adding a migration in `migrations/`.
- Local API endpoints are documented in `README.md` and `CLAUDE.md`.
