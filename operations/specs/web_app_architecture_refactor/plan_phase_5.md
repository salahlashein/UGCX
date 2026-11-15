# Phase 5: Next.js 15 App Router Hardening (Middleware & Skeletons)

# Document Control

- **Version**: 1.0.0
- **Date Created**: 2026-11-01
- **Last Updated**: 2026-11-01
- **Status**: COMPLETED
- **Phase**: 5 of 5
- **Parent Document**: `operations/specs/web_app_architecture_refactor/00_overview.md`

---

# Executive Summary

- **Goal**: Harden the UGCX Next.js 15 application with Edge Middleware route guards, cookie synchronization in the auth store, accessible loading skeletons, error boundaries, and 404 page adhering to C3 Sage design tokens.
- **Scope**: `apps/web/src/store/authStore.ts`, `apps/web/src/middleware.ts`, `apps/web/src/app/brand/loading.tsx`, `apps/web/src/app/creator/loading.tsx`, `apps/web/src/app/brand/error.tsx`, `apps/web/src/app/creator/error.tsx`, `apps/web/src/app/not-found.tsx`.
- **Domains**: Edge middleware, session cookie sync, route protection, UI skeleton states, error boundaries.
- **Tech Stack**: Next.js 15, React 19, TypeScript 5, C3 Sage design tokens.
- **Entry Condition**: Phase 4 completed, `apps/web` typecheck and tests pass cleanly.
- **Exit Condition**: Edge middleware guards protected routes, loading/error boundaries installed, typecheck, test suite, and `npm run build` pass with 0 errors.

---

# Tasks

| Task ID | Title | Verdict | Status | Implements | Target Files |
|---|---|---|---|---|---|
| `TASK-WAR5-001` | Synchronize session tokens to cookies in `authStore.ts` | EXTEND | DONE | DEC-WAR05 | `apps/web/src/store/authStore.ts` |
| `TASK-WAR5-002` | Create Edge Middleware for route and role protection | NEW | DONE | DEC-WAR05 | `apps/web/src/middleware.ts` |
| `TASK-WAR5-003` | Create `loading.tsx` skeletons for brand and creator routes | NEW | DONE | UI Hardening | `apps/web/src/app/brand/loading.tsx`, `apps/web/src/app/creator/loading.tsx` |
| `TASK-WAR5-004` | Create `error.tsx` boundaries and `not-found.tsx` | NEW | DONE | UI Hardening | `apps/web/src/app/brand/error.tsx`, `apps/web/src/app/creator/error.tsx`, `apps/web/src/app/not-found.tsx` |
| `TASK-WAR5-005` | Execute full verification: typecheck, test, and Next.js production build | VERIFY | DONE | Global | `apps/web` |

---
