# RailsForge

RailsForge is a developer toolkit for generating Rails resources safely, inspecting project health, and learning background-job patterns.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/railsforge run dev` — run the dashboard
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Dashboard: React + Vite
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild

## Where things live

- `artifacts/railsforge` — RailsForge dashboard and generator workbench.
- `artifacts/api-server/src/lib/railsforge.ts` — generator templates, staged file writes, system and database inspection.
- `artifacts/api-server/src/routes/railsforge.ts` — RailsForge HTTP routes.
- `lib/api-spec/openapi.yaml` — source of truth for dashboard API contracts.
- `tmp/railsforge/generated` — safe staging area for generated Rails files.

## Architecture decisions

- The dashboard and CLI-facing API share typed OpenAPI contracts so generator behavior is not duplicated in the UI.
- Generation previews are required before writes; existing staged files are reported as conflicts and are never overwritten silently.
- Generated resources are staged under `tmp/railsforge/generated` until a Rails project workspace is configured.
- Database inspection is metadata-only and masks connection details; missing Rails schema files produce an explicit empty state.

## Product

- Dashboard health overview with runtime, database, Redis, job-adapter, and activity status.
- API resource generator with fields, namespace, CRUD, timestamps, preview, conflicts, and staged file generation.
- Database health and schema explorer.
- Background-job examples for Active Job / Sidekiq patterns.
- Documentation and system information pages.

## User preferences

- Build RailsForge as a serious, open-source-quality developer product rather than a static prototype.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- Restart `artifacts/api-server: API Server` after backend changes and `artifacts/railsforge: web` after frontend changes.
- Ruby and Rails are reported as undetected until a Rails runtime is available in the project environment; this is intentionally explicit rather than mocked.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.