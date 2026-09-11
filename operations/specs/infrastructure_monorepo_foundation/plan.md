# Document Control
- **Version**: 1.0
- **Date Created**: 2026-08-31
- **Last Updated**: 2026-08-31
- **Status**: Implemented (TASK-P1-001 through TASK-P1-011 complete, exit condition verified)

---

# Executive Summary

- **Goal**: Stand up the monorepo, local dev environment, and CI pipeline that every later Phase 1 plan builds on.
- **Scope**: infrastructure
- **Domains**: infrastructure, backend (setup only), frontend (setup only)
- **Architecture**: One pnpm workspace with `apps/api` (NestJS), `apps/mobile` (Expo/React Native), and `packages/shared-types` (contracts shared by both). PostgreSQL runs locally via Docker Compose. GitHub Actions lints, type-checks, and builds both apps on every push.
- **Tech Stack**: pnpm workspaces, Docker Compose, PostgreSQL 16, Node.js 20 LTS, NestJS 10, Expo SDK (latest stable), TypeScript, ESLint, Prettier, GitHub Actions.
- **Entry Condition**: Repository contains only `HLD.md`, `CLAUDE.md`, `DESIGN.md`, and `.claude/`.
- **Exit Condition**: `pnpm install` succeeds at the root. `docker compose up -d db` starts PostgreSQL. The NestJS app boots and its `/api/v1/health` endpoint returns 200 with a live database check. The Expo app boots in Expo Go with one placeholder screen. CI runs lint, type-check, and build for both apps on push and pull request.

---

# Requirements

## Functional Requirements
- **REQ-001**: THE SYSTEM SHALL provide a single pnpm workspace containing `apps/api`, `apps/mobile`, and `packages/shared-types`.
- **REQ-002**: THE SYSTEM SHALL run PostgreSQL locally through Docker Compose for development.
- **REQ-003**: WHEN a client calls `GET /api/v1/health` THE SYSTEM SHALL respond with HTTP 200 and a JSON body confirming a live database connection.
- **REQ-004**: WHEN code is pushed or a pull request opens THE SYSTEM SHALL run lint, type-check, and build for `apps/api` and `apps/mobile` in CI.
- **SEC-001**: THE SYSTEM SHALL load every secret (database credentials, JWT secret, Paymob keys) from environment variables and SHALL exclude `.env` files from version control.
- **CON-001**: THE SYSTEM SHALL target Node.js 20 LTS across all apps.
- **GUD-001**: THE SYSTEM SHALL follow the NestJS recommended module layout for `apps/api` (`common/`, `config/`, `modules/`).
- **PAT-001**: THE SYSTEM SHALL use a modular monolith for `apps/api` — one deployable process, internally divided into feature modules with clear boundaries.

```gherkin
Feature: API health check
  Scenario: Health check confirms database connectivity
    Given the API process is running and connected to PostgreSQL
    When a client sends GET /api/v1/health
    Then the response status is 200
    And the response body is {"status":"ok","database":"connected"}

  Scenario: Health check reports a database outage
    Given the API process is running but PostgreSQL is unreachable
    When a client sends GET /api/v1/health
    Then the response status is 503
    And the response body is {"status":"degraded","database":"disconnected"}
```

---

# Dependencies

| ID | Name | Type | Version | Purpose |
|---|---|---|---|---|
| DEP-001 | pnpm | package manager | 9.x | Single workspace across api, mobile, shared-types |
| DEP-002 | Docker Desktop / Docker Compose | tool | latest stable | Local PostgreSQL, no local Postgres install needed |
| DEP-003 | @nestjs/cli | package | 10.x | Scaffold and run the NestJS app |
| DEP-004 | typescript | package | 5.x | Shared across all workspace packages |
| DEP-005 | eslint, prettier | package | latest stable | Consistent lint/format across the monorepo |
| DEP-006 | expo | package | latest stable SDK | Scaffold and run the mobile app |
| DEP-007 | postgres (Docker image) | service | 16-alpine | Local database engine |

Check each package's latest stable version and license before installing.

---

# Plan Details

## Design — *How it should happen*

### Impact on system design

This plan creates the repository shell only. It introduces no domain logic, no entities, and no business endpoints beyond a health check. Every later plan (backend core domain, escrow/payments, mobile app) is additive on top of this structure and does not change it.

### Decisions

| ID | Decision | Rationale | Alternatives Considered | Side effect (which modules?) |
|---|---|---|---|---|
| DES-P1-001 | pnpm workspaces, not Turborepo/Nx | Fewer moving parts for a solo/1-2 dev team; Turborepo's build-caching benefit is not needed at this repo size | Turborepo, Nx, separate repos per app | Root `package.json`, all apps |
| DES-P1-002 | Docker Compose runs PostgreSQL only in Phase 1, not the API or mobile app | Fastest local dev loop; production hosting target is a Phase 2 decision, not needed to start building | Fully containerized dev environment | `docker-compose.yml` |
| DES-P1-003 | Shared TypeScript types live in `packages/shared-types`, imported by API DTOs and the mobile API client | Single source of truth for the contract both the mobile app and the future website consume, per HLD §1.3 | Duplicate types per app | `apps/api`, `apps/mobile` |
| DES-P1-004 | NestJS uses class-validator/class-transformer for DTO validation, not a separate schema library (e.g. Zod) | Matches NestJS's native DTO pattern from the `nestjs` skill; avoids running two validation libraries side by side | Zod with a NestJS Zod pipe | `apps/api` only |

### Constraints & Assumptions

| Type | ID | Description | Impact if Wrong | Handling Strategy |
|---|---|---|---|---|
| Constraint | CON-P1-001 | No production hosting target is chosen yet | None for Phase 1; revisit before public launch | Keep Docker Compose dev-only; add a deployment plan before Phase 1 launch |
| Assumption | ASM-P1-001 | The developer's machine runs Docker Desktop (with WSL2 backend on Windows) | `docker compose up` fails | Document the Docker Desktop + WSL2 requirement in the root README |
| Assumption | ASM-P1-002 | A single Postgres database serves both `apps/api` and future admin tooling | A second database would need its own migration path | Namespace tables clearly; add a second `DATABASE_URL` only if a real need appears |

### Edge cases

| ID | Scenario | Expected Behavior | Handling Strategy |
|---|---|---|---|
| EDGE-P1-001 | Docker is not installed or not running | `pnpm dev:db` fails with a clear error | Root README documents the Docker Desktop prerequisite; add a pre-flight check script that prints a friendly message instead of a raw Docker error |
| EDGE-P1-002 | `.env` file is missing at API boot | NestJS fails fast at startup, not at first request | Validate required environment variables in `apps/api/src/config/env.validation.ts` using class-validator, called from `ConfigModule.forRoot({ validate })` |
| EDGE-P1-003 | CI runs without a `.env` file | CI must not depend on developer secrets | CI uses a checked-in `.env.example`-derived test config with dummy values; no real secrets in CI for this plan |

### Directory Map

```text
UGCX/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/
│   │   │   │   ├── configuration.ts
│   │   │   │   └── env.validation.ts
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/
│   │   │   │   │   └── all-exceptions.filter.ts
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   └── pipes/
│   │   │   └── modules/
│   │   │       └── health/
│   │   │           ├── health.controller.ts
│   │   │           └── health.module.ts
│   │   ├── test/
│   │   ├── .env.example
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── mobile/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── navigation/
│       │   ├── screens/
│       │   │   └── PlaceholderScreen.tsx
│       │   ├── i18n/
│       │   └── services/
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared-types/
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── .gitignore
└── README.md
```

### Directory Specifications

| ID | Task | File(s) | Responsibility / Expected Behavior | Validations/Error handling | Key Configurations/settings |
|---|---|---|---|---|---|
| TASK-P1-001 | Initialize git and pnpm workspace | `package.json`, `pnpm-workspace.yaml`, `.gitignore` | Root workspace declares `apps/*` and `packages/*` as workspace members, adds shared root scripts (`dev`, `lint`, `build`) | N/A | `.gitignore` excludes `.env`, `node_modules`, `dist`, `.expo` |
| TASK-P1-002 | Add local PostgreSQL via Docker Compose | `docker-compose.yml` | Defines a `db` service on `postgres:16-alpine`, exposes port 5432, persists data to a named volume, reads credentials from `.env` | Compose fails loudly if `.env` is missing required vars | `POSTGRES_DB=ugcx`, `POSTGRES_USER`, `POSTGRES_PASSWORD` from env |
| TASK-P1-003 | Scaffold NestJS app | `apps/api/*` | `nest new` scaffold, strict TypeScript, module layout per GUD-001 | N/A | `tsconfig.json` has `strict: true` |
| TASK-P1-004 | Add config module with env validation | `apps/api/src/config/configuration.ts`, `env.validation.ts` | Loads and validates `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV` at boot; app refuses to start if any required var is missing or malformed | class-validator on a typed env class; throws on first `bootstrap()` call, before the HTTP listener opens | `ConfigModule.forRoot({ isGlobal: true, validate })` |
| TASK-P1-005 | Add global exception filter and structured logging | `apps/api/src/common/filters/all-exceptions.filter.ts`, `main.ts` | Every unhandled exception returns the standard error envelope from api-patterns (`{ error: { code, message } }`) and never leaks a stack trace to the client; logs the full error server-side with `nestjs-pino` | Maps `HttpException` to its own status; everything else maps to 500 | Registered globally via `app.useGlobalFilters(new AllExceptionsFilter())` |
| TASK-P1-006 | Add health module | `apps/api/src/modules/health/*` | `GET /api/v1/health` checks DB connectivity via a lightweight `SELECT 1` and returns the envelope defined in REQ-003 | Returns 503, not a thrown 500, when the DB check fails | Registered under global prefix `api/v1` set in `main.ts` |
| TASK-P1-007 | Scaffold Expo app | `apps/mobile/*` | `create-expo-app` with TypeScript template, one placeholder screen rendering "UGCX" | N/A | `app.json` sets `"newArchEnabled": true`, bundle identifiers left as placeholders for Phase-1 mobile plan to fill in |
| TASK-P1-008 | Create shared-types package | `packages/shared-types/*` | Empty barrel export (`index.ts`) ready to receive DTO types from the backend plans; both `apps/api` and `apps/mobile` add it as a workspace dependency | N/A | Published as a private workspace package, not to npm |
| TASK-P1-009 | Add root lint/format config | `.eslintrc`, `.prettierrc` (or flat config equivalents) | One shared ESLint + Prettier config extended by both apps | CI fails the build on lint errors | TypeScript-aware ESLint rules, Prettier as the formatter, no conflicting rules between the two |
| TASK-P1-010 | Add CI pipeline | `.github/workflows/ci.yml` | On push/PR: install with pnpm, lint, type-check, build `apps/api` and `apps/mobile` | Job fails the check if any step fails; no deploy step in this plan | Node 20 in the CI runner, pnpm cache enabled |
| TASK-P1-011 | Write root README | `README.md` | Prerequisites (Node 20, pnpm, Docker Desktop), setup steps (`pnpm install`, `docker compose up -d db`, `pnpm --filter api dev`, `pnpm --filter mobile start`) | N/A | Written in STE-flavored English per `CLAUDE.md` |

### Schemas

No API or database schemas are introduced in this plan. `packages/shared-types` starts as an empty barrel file; the backend-core plan is the first to add real DTOs.

### Data Models & flows

<settings>
No database tables are created in this plan. The only new environment variables are infrastructure-level:

| Variable | Purpose | Secret? | Default |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string for `apps/api` | Yes | `postgres://ugcx:ugcx@localhost:5432/ugcx` (local only) |
| `JWT_SECRET` | Placeholder for the auth module added in the backend-core plan | Yes | none — must be set, no default |
| `PORT` | API listen port | No | `3000` |
| `NODE_ENV` | Runtime environment | No | `development` |
</settings>

<Data-Models>
No entities in this plan.
</Data-Models>

<Data-flow>
```
Developer machine
  1. pnpm install                    → installs all workspace packages
  2. docker compose up -d db          → PostgreSQL container starts, port 5432
  3. pnpm --filter api dev            → NestJS boots, validates env, connects to db
  4. GET http://localhost:3000/api/v1/health → { status: "ok", database: "connected" }
  5. pnpm --filter mobile start        → Expo dev server starts, QR code for Expo Go
```
</Data-flow>

---

#### **Process** (runtime, QA, deployment)

- **Runtime Considerations**: Local development only in this plan. No staging or production runtime is configured yet.
- **Deployment Impact**: None yet. A hosting decision (e.g., Railway, Fly.io, Render for the API; EAS Build for the mobile app) belongs to a later infrastructure plan, once Phase 1 features exist to deploy.

---

# Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RISK-001 | Windows/Docker Desktop friction slows local setup for a solo developer | Med | Low | Document exact WSL2 + Docker Desktop steps in README; verified as part of this plan's exit condition |
| RISK-002 | pnpm workspace misconfiguration breaks cross-package imports (`shared-types` not resolving) | Low | Med | Verify with a smoke import in both `apps/api` and `apps/mobile` before marking this plan done |

---

# Code Guidelines

**From `clean-code`:**
- Keep it simple (GEN-01): this plan intentionally adds no business logic, only scaffolding.
- Modular monolith with layered separation inside `apps/api` (GEN-011): `common/`, `config/`, `modules/` stay distinct; controllers stay thin.
- No hard-coded config in low-level modules (DES-01): all environment access goes through the `ConfigModule`, never `process.env` scattered across files.
- Structured JSON logging (LOG-02): `nestjs-pino` from the first commit, not `console.log`.

**From `security`:**
- No secrets in code or version control (SEC-01/A05): `.env` is git-ignored; `.env.example` holds only placeholder values.
- Fail securely (Exception Handling): the global exception filter never returns a stack trace or raw error message to the client.
- TLS/HTTPS is a deployment-time concern, out of scope for local dev in this plan, but the API must never assume plaintext HTTP once a real hosting target is chosen.

**From `nestjs`:**
- Use `@Injectable()`/constructor injection from the first module; no manual instantiation.
- File naming: `*.controller.ts`, `*.module.ts`, matching the health module scaffolded here, so later modules stay consistent.
