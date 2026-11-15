# Web Ledger Mono Redesign: Implementation Overview

# Document Control

- **Version**: 1.0.0
- **Date Created**: 2026-10-30
- **Last Updated**: 2026-10-30
- **Status**: DRAFT, waiting for the user to start phase W0
- **Parent**: `operations/specs/web_ledger_mono/00_screen_gap_assessment.md` (APPROVED, decisions Q1 to Q17)
- **Mockups**: `operations/specs/web_ledger_mono/layout-studio.html`
- **Phase files**: `plan_phase_W0.md`, `plan_phase_W1.md`, `plan_phase_W2.md`, `plan_phase_W3.md`, `plan_phase_W4.md`, `plan_later.md`
- **Rule**: This document set changes no application code. A builder run changes code, one phase at a time.

---

# Executive Summary

- **Goal**: Restyle the 23 screens of `apps/web` to the Ledger Mono finish and the layout the user picked for each screen.
- **Method**: Fix the API safety problems first. Then change the shared tokens and components once. Then rebuild each screen on top of them. Money and workflow backend work comes last, and each hidden part of a screen returns when its backend item ships.
- **Entry condition**: All 23 routes ship today. `apps/web` has `components/ui`, `theme/*`, `hooks/api/*`, and `AppShell`. The latest API migration is `1788600000007-CreatePayoutRequests`.
- **Exit condition**: All 23 screens show the picked layout in English and Arabic. Every item in the hide list has a reveal or a recorded decision to defer. `pnpm --filter api` and `pnpm --filter web` lint, typecheck, test, and build pass.

---

# Phase Map

```text
 W0 API safety ──┐
                 ├──> W2 screens on existing data ──> W3 money backend + screens ──> W4 workflow backend + reveal
 W1 tokens/ui ───┘
```

| Phase | File | Content | Backend items | Screens |
|---|---|---|---|---|
| W0 | `plan_phase_W0.md` | API P0 fixes. Runs in parallel with W1. | BG-01, 02, 03, 04, 05, 06, 07, 11 | None directly |
| W1 | `plan_phase_W1.md` | Tokens, fonts, primitives, shared components, `AppShell`, money helper, `useBrandRole`, `DESIGN.md` web section | None | Shell only. Every page picks up the new primitives. |
| W2 | `plan_phase_W2.md` | One task per screen that needs no new backend. Each task names its hides. | None | 23, 1, 4, 13, 14, 15, 3, 2, 5, 6, 7, 12, 17, 8, 11, 19, 16, 18, 20, 21, 22 (21 tasks) |
| W3 | `plan_phase_W3.md` | Money backend, then the money screens and reveals | BG-14, 09, 10, 08, 22, 26 | 9, 10. Reveal on 1, 2, 3. |
| W4 | `plan_phase_W4.md` | Workflow backend, then reveals | BG-29, 30, 31, 33, 34, 15, 16, 21, 23, 24, 25, 28, 12, 13, 39 | Reveal on 4, 5, 6, 8, 11, 13, 14, 15, 16, 18, 19, 20, 21, 22 |
| Later | `plan_later.md` | Deferred and decision items | BG-17, 18, 19, 20, 27, 32, 35, 36, 37, 38, 40, 41 | As decided |

BG-42 is cancelled by decision Q14. Phase W0 and phase W1 do not depend on each other. Run W0 first because it closes the security risks.

---

# Cross Cutting Rules

## Decisions that bind every phase

These come from `CLAUDE.md`. Do not reopen them.

1. Escrow funds at the campaign. A proposal accept allocates from the campaign balance and raises no second charge.
2. `transactions` is the only ledger. Add no escrow table.
3. Brand roles `owner`, `approver`, and `viewer` live in `brand_members`. `BrandRoleGuard` enforces them. They are not in the JWT.
4. The notification catalog is `packages/shared-types/src/notifications.ts`. Add no second catalog.
5. Money is `numeric(10,2)` strings in the database and integer cents in arithmetic. Never use `parseFloat` on an amount.
6. Every new screen ships an English and an Arabic screenshot pair before its phase closes (decision Q2 extends this to web).

## Decisions from the assessment

| ID | Binding result for the build |
|---|---|
| Q1 | Ledger Mono is for the web only. Mobile keeps its radii. `DESIGN.md` gets a web subsection in W1. |
| Q2 | The screenshot pair rule applies to web screens. |
| Q3 | Dashboard "spend" means money released. Label the current number "Funded this month" until BG-08 ships. |
| Q4 | Keep the 6 API niche values. |
| Q5 | "Format" is the existing `videoType`. Add no platform field. |
| Q6 | Brief status label is "Open". Creator proposal labels follow the studio: "Applied", "Shortlisted". Update the glossary in `brand_flow_integration/00_overview.md` in W1. |
| Q7 | A brief reference is a short id derived from the UUID (`formatRef`). Add no sequence column. |
| Q8 | "Deliverable N" is the version number. Drop "of 3". |
| Q9 | Keep deliverable decline in an overflow menu with a confirm step. |
| Q10 | Add `slots` and `closesAt` to the Budget section and `doNotSay` to the Video section of the brief form. The API already stores all three fields on the campaign. This is frontend work in W2 (TASK-W2-11). |
| Q11 | The brand ledger uses the escrow view. Funded is plus. Released and refunded are minus. |
| Q12 | Creators get a chat list at `/creator/chats`. |
| Q13 | Profile headers show one status badge for vetting or verification. |
| Q14 | Login codes go by email. No SMS. The login page drops the phone field. |
| Q15 | No clearance window in v1. Hide the studio "Pending" cell on Earnings. |
| Q16 | The delivery clock starts at product received when the brief ships a product. Otherwise it starts at accept. |
| Q17 | The revision limit is per brief. The default is 2. |

## Status words (glossary change from Q6)

| Value | Brand label | Creator label |
|---|---|---|
| Campaign `live` | Open | Open |
| Proposal `applied` | Applied | Applied |
| Proposal `shortlisted` | Shortlisted | Shortlisted |
| Proposal `accepted` | Accepted | Accepted |
| Proposal `declined` | Declined | Declined |

The creator label "Pending" is retired for proposals. Keep the other values in the glossary of `brand_flow_integration/00_overview.md`.

## Money rules

1. The API uses `apps/api/src/common/utils/money.ts`. The web uses `apps/web/src/utils/money.ts` (NEW in W1). Both convert to integer cents before any sum or difference.
2. Every amount prints with two decimals: `EGP 3,200.00`. `formatMoney` changes in W1.
3. A derived number (running balance, escrow impact, totals) has a unit test that compares it with the API number for the same data.
4. The three money words that differ between the studio and the API are resolved in this order. "Spend" follows Q3. "Allocated" shows allocated minus released. Creator "Available" is the API `pendingBalance`, and creator "Paid out" is the API `clearedBalance`.

## RTL rules

1. JetBrains Mono has no Arabic glyphs. Numbers, references, and dates use mono. Arabic words fall back to IBM Plex Sans Arabic.
2. Under `:lang(ar)` set `letter-spacing: 0` and `text-transform: none` for overlines, badges, tags, and table headers.
3. Wrap every amount, reference, and email in `dir="ltr"` or `<bdi>`.
4. Mirror chevrons, back arrows, the pipeline arrow, and steppers. Do not mirror the in and out ledger icons.
5. Use logical CSS only: `inset-inline`, `padding-inline`, `text-align: start`.
6. Use font weights 400 and 500 only. This includes the OTP email template.

## Role aware UI

The web learns the brand team role from `memberRole` on `GET /brands/me` (BG-11, W0). `useBrandRole()` and `can(action)` ship in W1. Every brand screen hides or disables Accept, Approve, Fund, and Close for a `viewer`. The API stays the source of truth.

## Screenshot pair rule for the web

No browser test tool is in the repo today. Neither `apps/web/package.json` nor the root package lists Playwright.

1. For each screen, take one English screenshot (`dir="ltr"`) and one Arabic screenshot (`dir="rtl"`) at 1280 px width.
2. Save them to `operations/specs/web_ledger_mono/screenshots/<screen-id>/en.png` and `ar.png`. Use the screen ids from the layout studio, for example `dashboard`, `proposals`, `earnings`.
3. Take them with the Browser pane tools in the Claude desktop app. The user may add Playwright later. That is an open item and does not block W0 or W1.
4. A phase is not done until every screen it touched has both files.

---

# Hide List and Reveal Checklist

A "hide" is a part of the picked layout that the builder does not render until its backend item ships. Each W2 task lists its own hides. This table is the master list of reveals.

| Backend item | Reveals | Phase |
|---|---|---|
| BG-08 | Monthly chart and released totals on screen 1 | W3 |
| BG-22 | "Left after accept" impact line on screen 2 | W3 |
| BG-26 | Reference and type columns on the screen 3 ledger | W3 |
| BG-29 | "Product received" step on screens 4, 11, 15 | W4 |
| BG-30 | Due date on screens 4, 15, 19 | W4 |
| BG-31 | Revision counter on screens 6, 11, 15, 19 | W4 |
| BG-33 | Approved and paid dates on screens 11, 15 | W4 |
| BG-34 | Approve note stored on screen 6 | W4 |
| BG-15 | Hired avatars, funded date, proposal stats on screens 1, 5, 8, 18 | W4 |
| BG-16 | Search, multi niche, sort, proposal count on screen 13 | W4 |
| BG-21 | Creator stats per proposal on screen 2 | W4 |
| BG-23 | Close date on screen 20 | W4 |
| BG-25 | Creator self stats on screens 14, 16 | W4 |
| BG-12 | Brand public stats on screen 21 | W4 |
| BG-39 | User name and language save on screen 22 | W4 |

Deferred reveals (BG-19, 20, 27, 32, 37, 38, 40, 41) stay hidden. `plan_later.md` records each one.

---

# Verification Commands

These script names exist in the package files today.

```bash
# web
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter web build

# api, for every phase with backend items
pnpm --filter api lint
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter api build

# shared types, when a phase touches packages/shared-types
pnpm --filter @ugcx/shared-types lint
pnpm --filter @ugcx/shared-types typecheck
pnpm --filter @ugcx/shared-types build
```

`pnpm --filter web test` runs only `src/__tests__/smoke.test.ts` today. Each phase adds tests for its helpers to that runner or extends the `test` script.

---

# Risks

| ID | Risk | Mitigation |
|---|---|---|
| RISK-W-01 | A shared deploy ships before BG-01 and keeps the fixed login code. | W0 runs first. Block any shared deploy on BG-01. |
| RISK-W-02 | A derived money number differs from the API number. | Integer cents helper. Hide numbers that need BG-22. Unit tests for every derive helper. |
| RISK-W-03 | Hidden parts never come back. | The reveal table above. W4 closes only when every row is done or deferred. |
| RISK-W-04 | Screen 18 makes one call per brief and slows large brands. | Limit to open briefs. Replace with BG-15. |
| RISK-W-05 | Mono uppercase breaks Arabic joining. | `:lang(ar)` overrides in W1. Arabic screenshot pair for each screen. |
| RISK-W-06 | BG-14 changes the fund rule and breaks the mobile fund screen. | Keep the old range check as a lower bound. Run the mobile fund flow in the W3 test pass. |
| RISK-W-07 | Email delivery fails after BG-01 because SMTP settings are empty. | Document `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM` in `apps/api/.env.example`. In production, refuse to start with no SMTP settings. |

---

# Open Items for the User

1. Add real SMTP credentials to the API environment before a shared deploy.
2. Decide whether to add Playwright for the screenshot pair rule.
3. Screen 3 (Creator earnings) is missing from the W2 order in the assessment. This plan adds it as TASK-W2-07, after W0 TASK-W0-07. Confirm.
