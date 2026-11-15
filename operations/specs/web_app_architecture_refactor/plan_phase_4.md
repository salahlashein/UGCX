# Phase 4: Feature Slice Decomposition of Monolithic Pages

# Document Control

- **Version**: 1.0.0
- **Date Created**: 2026-11-01
- **Last Updated**: 2026-11-01
- **Status**: COMPLETED
- **Phase**: 4 of 5
- **Parent Document**: `operations/specs/web_app_architecture_refactor/00_overview.md`

---

# Executive Summary

- **Goal**: Decompose monolithic pages (`BrandDashboardPage`, `CreatorHomePage`, `BrandBriefsPage`) into modular, single-responsibility feature slice components under `src/features/` with strict line count constraints (no component > 150 lines, orchestrator pages < 80 lines).
- **Scope**: `apps/web/src/features/brand/dashboard/`, `apps/web/src/features/creator/home/`, `apps/web/src/features/brand/briefs/`, and page orchestrators in `apps/web/src/app/`.
- **Domains**: UI architecture, Feature-Sliced Design.
- **Tech Stack**: Next.js 15, React 19, TypeScript 5, C3 Sage design tokens.
- **Entry Condition**: Phase 3 completed, `apps/web` typecheck and tests pass cleanly.
- **Exit Condition**: All target feature components created within line limits, orchestrator pages refactored to < 80 lines, typecheck and test suite pass with 0 errors.

---

# Tasks

| Task ID | Title | Verdict | Status | Implements | Target Files |
|---|---|---|---|---|---|
| `TASK-WAR4-001` | Decompose `BrandDashboardPage` into feature slices | REPLACE | DONE | DEC-WAR04 | `apps/web/src/features/brand/dashboard/components/*`, `apps/web/src/app/brand/dashboard/page.tsx` |
| `TASK-WAR4-002` | Decompose `CreatorHomePage` into feature slices | REPLACE | DONE | DEC-WAR04 | `apps/web/src/features/creator/home/components/*`, `apps/web/src/app/creator/home/page.tsx` |
| `TASK-WAR4-003` | Decompose `BrandBriefsPage` into feature slices | REPLACE | DONE | DEC-WAR04 | `apps/web/src/features/brand/briefs/components/*`, `apps/web/src/app/brand/briefs/page.tsx` |
| `TASK-WAR4-004` | Execute verification commands and assert line caps and 0 errors | VERIFY | DONE | Global | `apps/web/src/**` |

---
