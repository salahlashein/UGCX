# Phase 2: Deduplication of Common Usages & Shared Pure Utilities

# Document Control

- **Version**: 1.0.0
- **Date Created**: 2026-11-01
- **Last Updated**: 2026-11-01
- **Status**: COMPLETED
- **Phase**: 2 of 5
- **Parent Document**: `operations/specs/web_app_architecture_refactor/00_overview.md`

---

# Executive Summary

- **Goal**: Eliminate duplicated boilerplate and repeated inline logic across web pages by creating shared, tested pure functions and consolidating hook usage ("use function for the things that we have double usage").
- **Scope**: Utility layer (`apps/web/src/utils`), hook adoption, and screen consumption.
- **Domains**: Data aggregators, query lifecycle helpers, keyboard shortcut consumption, unit tests.
- **Architecture**: Pure mathematical and aggregation functions placed in `src/utils/` with comprehensive unit tests. Screens delegate calculation and state merging to these functions instead of running inline loops or manual event listeners.
- **Tech Stack**: TypeScript 5, React 19, TanStack Query v5, Node.js Test Runner.
- **Entry Condition**: Phase 1 completed, `apps/web` typecheck and tests pass.
- **Exit Condition**: `combineQueries` is adopted across screens with multi-query states, manual `addEventListener('keydown')` calls are eliminated, escrow/proposal tallying calculations live in pure functions, and 100% of new utilities have unit tests.

---

# Requirements

## Functional, Security, Constraint & Pattern Requirements

- **REQ-WAR2-001**: THE SYSTEM SHALL provide a pure function `combineQueries(...queries)` in `src/utils/queryAggregator.ts` that takes an arbitrary number of TanStack Query results and returns `{ isLoading: boolean, isError: boolean, isFetching: boolean, refetch: () => Promise<void> }`.
- **REQ-WAR2-002**: THE SYSTEM SHALL use `useKeyboardShortcut` across all pages that listen for key shortcuts (such as `/` to focus search or `Escape` to close modals), removing inline `window.addEventListener('keydown')` listeners.
- **REQ-WAR2-003**: THE SYSTEM SHALL extract `calculateStillInEscrowCents(briefs)` and `groupBriefsByPipelineStage(briefs, locale)` into `src/utils/dashboardMetrics.ts`.
- **REQ-WAR2-004**: THE SYSTEM SHALL extract `tallyProposalStatuses(proposals)` into `src/utils/proposalAggregator.ts` to compute `{ applied, shortlisted, won, waiting }` counts deterministically.
- **REQ-WAR2-005**: THE SYSTEM SHALL provide unit tests for all new utility functions with edge cases (empty arrays, negative balances, missing status fields).
- **CON-WAR2-001**: Utility functions MUST remain pure, free of side-effects, and independent of React component rendering state.

```gherkin
Feature: Shared Utility Deduplication

  Scenario: Aggregating multiple TanStack Query states
    Given three queries where query1 is loaded, query2 is loading, and query3 has error
    When "combineQueries(query1, query2, query3)" is executed
    Then it returns "isLoading: true" and "isError: true"
    When all three queries resolve successfully
    Then it returns "isLoading: false" and "isError: false"
    And calling "refetch()" triggers refetch on all three queries concurrently

  Scenario: Calculating brief pipeline stage distribution
    Given an array of 5 briefs in different lifecycle stages
    When "groupBriefsByPipelineStage(briefs, 'en')" is called
    Then it returns exactly 5 PipelineStage objects with accurate counts and hot indicators
```

---

# Tasks

| Task ID | Title | Verdict | Status | Implements | Target Files |
|---|---|---|---|---|---|
| `TASK-WAR2-001` | Create `src/utils/queryAggregator.ts` and unit test | NEW | DONE | REQ-WAR2-001 | `apps/web/src/utils/queryAggregator.ts`, `apps/web/src/__tests__/queryAggregator.test.ts` |
| `TASK-WAR2-002` | Create `src/utils/dashboardMetrics.ts` and `proposalAggregator.ts` | NEW | DONE | REQ-WAR2-003, REQ-WAR2-004 | `apps/web/src/utils/dashboardMetrics.ts`, `apps/web/src/utils/proposalAggregator.ts`, unit tests |
| `TASK-WAR2-003` | Replace duplicate keydown listeners with `useKeyboardShortcut` | REPLACE | DONE | REQ-WAR2-002 | `apps/web/src/app/brand/briefs/page.tsx`, `apps/web/src/app/brand/briefs/[id]/proposals/page.tsx`, `apps/web/src/app/brand/dashboard/page.tsx` |
| `TASK-WAR2-004` | Adopt `combineQueries` and metric functions across Brand and Creator pages | EXTEND | DONE | REQ-WAR2-001, REQ-WAR2-003, REQ-WAR2-004 | `apps/web/src/app/brand/dashboard/page.tsx`, `apps/web/src/app/creator/home/page.tsx`, `apps/web/src/app/brand/briefs/page.tsx` |
| `TASK-WAR2-005` | Verification and test suite execution | VERIFY | DONE | REQ-WAR2-005 | `apps/web/src/**` |

### Detailed Steps

#### `TASK-WAR2-001`: Create `queryAggregator.ts`
Implement:
```typescript
export interface QueryLike {
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  refetch?: () => Promise<unknown> | unknown;
}

export interface CombinedQueryResult {
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => Promise<void>;
}

export function combineQueries(...queries: (QueryLike | undefined | null)[]): CombinedQueryResult;
```

#### `TASK-WAR2-002`: Create `dashboardMetrics.ts` and `proposalAggregator.ts`
1. Move `stillInEscrowCents` calculation into `calculateStillInEscrowCents(briefs: CampaignBrief[])`.
2. Move `pipelineStages` generation into `groupBriefsByPipelineStage(briefs: CampaignBrief[], locale: Locale)`.
3. Move proposal counting into `tallyProposalStatuses(proposals: ProposalListItem[])`.

#### `TASK-WAR2-003`: Deduplicate Keyboard Listeners
Replace manual `useEffect` + `window.addEventListener('keydown')` in:
- `BrandBriefsPage` (`/` to focus search)
- `BrandProposalsPage` (`/` to focus search)
- `BrandDashboardPage` (`/` to focus search)
Use:
```typescript
useKeyboardShortcut('/', (e) => {
  e.preventDefault();
  searchInputRef.current?.focus();
});
```

#### `TASK-WAR2-004`: Wire Shared Functions into Pages
Update `BrandDashboardPage` and `CreatorHomePage` to consume `combineQueries` and the pure metric functions.

#### `TASK-WAR2-005`: Verification
Run:
```powershell
npm --prefix apps/web run typecheck
npm --prefix apps/web test
```
Assert all new test suites pass with 0 failures.
