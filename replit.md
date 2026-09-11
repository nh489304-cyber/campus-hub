# Campus Hub

Campus Hub gives students one searchable place to discover clubs, understand membership requirements, and find upcoming events with practical attendance details.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/campus-hub` — the student-facing React web app
- `artifacts/api-server/src/routes/campus.ts` — campus data API routes
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/campus.ts` — PostgreSQL schema for clubs and events

## Architecture decisions

- The web app uses generated React Query hooks from the OpenAPI contract rather than hand-written API types.
- Club roles are stored as structured JSON on each club because role openings and responsibilities are displayed as a cohesive club-owned list.
- Initial demo content is seeded by the API server only when the campus tables are empty, so the first preview is useful without blocking future imports.

## Product

- Students can browse 500+ clubs, search and filter by category, and open club detail pages with office location, eligibility, mission, advisor, schedule, and open roles.
- Students can browse upcoming events with date, venue, entry fee, registration criteria, seats remaining, and duty-leave applicability.
- Students can save clubs and events locally for quick return.

## User preferences

- Keep the experience accessible to all students and consolidate fragmented campus information into one place.

## Gotchas

- API changes must be made in `lib/api-spec/openapi.yaml`, then regenerated with the api-spec codegen command before using new client hooks.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
