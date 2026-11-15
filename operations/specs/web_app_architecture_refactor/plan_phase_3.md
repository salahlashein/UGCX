# Phase 3: Hook Separation, Domain Isolation & Query Key Factories

# Document Control

- **Version**: 1.0.0
- **Date Created**: 2026-11-01
- **Last Updated**: 2026-11-01
- **Status**: COMPLETED
- **Phase**: 3 of 5
- **Parent Document**: `operations/specs/web_app_architecture_refactor/00_overview.md`

---

# Executive Summary

- **Goal**: Consolidate and govern all TanStack Query cache operations through a centralized hierarchical Query Key Factory `apps/web/src/services/queryKeys.ts`, refactor all API hooks to consume `queryKeys`, and extract composite domain hooks `useBrandDashboardData` and `useCreatorHomeData` to isolate data fetching, query aggregation, and business metric derivation from page components.
- **Scope**: TanStack Query data layer (`apps/web/src/services`, `apps/web/src/hooks/api`), composite domain hooks (`apps/web/src/hooks/domain`), and unit tests.
- **Domains**: Data fetching layer, query key management, composite state orchestration.
- **Architecture**: Hierarchical query key factory following TanStack Query best practices, modular API hooks, and domain-level composite hooks that encapsulate `combineQueries` and pure metric calculations.
- **Tech Stack**: TypeScript 5, React 19, `@tanstack/react-query` v5, Node.js Test Runner.
- **Entry Condition**: Phase 2 completed, `apps/web` typecheck and tests pass cleanly.
- **Exit Condition**: `queryKeys.ts` governs all API queries and mutations, API hooks no longer use raw string arrays, composite domain hooks are tested and functional, and all unit tests pass.

---

# Tasks

| Task ID | Title | Verdict | Status | Implements | Target Files |
|---|---|---|---|---|---|
| `TASK-WAR3-001` | Create Query Key Factory and unit tests | NEW | DONE | DEC-WAR03 | `apps/web/src/services/queryKeys.ts`, `apps/web/src/__tests__/queryKeys.test.ts` |
| `TASK-WAR3-002` | Refactor API hooks to consume `queryKeys` | REPLACE | DONE | DEC-WAR03 | `apps/web/src/hooks/api/*` |
| `TASK-WAR3-003` | Create composite domain hooks `useBrandDashboardData` & `useCreatorHomeData` | NEW | DONE | DEC-WAR04 | `apps/web/src/hooks/domain/*` |
| `TASK-WAR3-004` | Execute verification commands and assert 0 errors | VERIFY | DONE | Global | `apps/web/src/**` |

---
