# Web Ledger Mono Redesign: Screen Gap Assessment

# Document Control

- **Version**: 1.1.0
- **Date Created**: 2026-10-30
- **Last Updated**: 2026-10-30
- **Status**: APPROVED. The user accepted all 17 recommended answers on 2026-10-30. See Decisions.
- **Inputs**: `operations/specs/web_ledger_mono/layout-studio.html` (23 picked layouts), `CLAUDE.md`, `HLD.md`, `operations/specs/brand_flow_integration/00_overview.md`, `operations/specs/web_app_soft_launch/00_overview.md`
- **Owner**: Planner agent. Each build phase hands to the `builder` agent. The user answered all open questions on 2026-10-30.
- **Scope rule**: This document changes no application code. It records what the picked layouts need, what the API gives today, and the order to build.

---

# Executive Summary

- **Goal**: Restyle all 23 web screens in `apps/web` to the Ledger Mono finish and the picked layout for each screen.
- **Finding 1**: Every one of the 23 routes already ships. Every page is a REPLACE of its layout. Most hooks stay and some hooks EXTEND.
- **Finding 2**: 2 screens need backend work before the picked layout makes sense: Fund escrow (9) and Billing (10). The "Request payout" action on Earnings (3) also waits for BG-06.
- **Finding 3**: 18 screens can ship now with existing data if the builder hides named parts. 2 screens can ship as designed: Chats (12) and Notifications (17). Creator proposals (20) ships as designed after one S backend change.
- **Finding 4**: The audit found 7 P0 security or defect items in the API. The worst item is a fixed OTP code (`0000`) that `AuthService.verifyOtp` accepts in every environment.
- **Finding 5**: The deduplicated backend gap list has 42 items: 21 S, 16 M, 5 L. 8 of the M and L items are "defer" items. The builder hides their UI.
- **Finding 6**: Three money words have two meanings between the studio and the API: "spend", "allocated", and the creator "pending" balance. The user must pick one name for each before the money screens ship.

---

# How to Read This Document

All API routes below carry the global prefix `/api/v1`. "Hook" means a function in `apps/web/src/hooks/api/`.

## Status legend for each data point

| Status | Meaning |
|---|---|
| AVAILABLE | An endpoint and a web hook exist. The field is in the response. |
| API-ONLY | An endpoint exists. No web hook calls it. |
| DERIVABLE | The client can compute it from data the page already fetches. The row says how. |
| MISSING | The API does not give it. A backend gap ID (`BG-xx`) names the work. |

## Recommendation legend

| Label | Meaning |
|---|---|
| BUILD AS DESIGNED | All data exists or the backend change is S. |
| BUILD WITH EXISTING DATA | Ship now. Hide or simplify the parts that the screen section names. |
| NEEDS BACKEND FIRST | The core value of the layout depends on new backend work. |

## Priority legend

| Priority | Meaning |
|---|---|
| P0 | The marketplace loop or money trust depends on this screen. Build first. |
| P1 | Daily use. Build in the first screen wave after P0. |
| P2 | Low frequency or support screen. |

## Size legend

| Size | Rough effort |
|---|---|
| S | Less than one day. One file or one query. |
| M | One to three days. Migration, new query, or new component with states. |
| L | More than three days, an outside provider, or a scheduled job that moves money. |

---

# Cross Cutting Findings

## P0 security and defect items

These items do not belong to one screen. Fix them before the redesign ships to any shared environment.

| ID | Finding | Evidence | Size |
|---|---|---|---|
| BG-01 | `verifyOtp` accepts `0000` or `000000` for every phone and email in every environment. `sendOtp` always emails the fixed code `0000`. Fix (decision Q14): generate a random code per request, store only its hash with a 10 minute expiry and an attempt limit, send it through `MailerService.sendOtpEmail`, and accept `0000` only when `NODE_ENV` is `development` or `test`. Reject phone OTP in production. | `apps/api/src/modules/auth/auth.service.ts`, lines 181 to 194 | M |
| BG-02 | `PATCH /proposals/:id/status` has no `BrandRoleGuard`. A `viewer` can shortlist or decline. | `apps/api/src/modules/proposals/proposals.controller.ts`, line 91 | S |
| BG-03 | `POST /collaborations/:id/confirm-shipment` has no `BrandRoleGuard`. A `viewer` can mark a shipment. | `apps/api/src/modules/collaborations/collaborations.controller.ts`, line 96 | S |
| BG-04 | `POST /campaigns/:id/escrow/checkout` allows `owner` only. `POST /campaigns/:id/escrow/manual-payment` allows `owner` and `approver`. The two fund paths disagree. | `apps/api/src/modules/campaigns/campaigns.controller.ts`, lines 130 to 158 | S |
| BG-05 | `GET /campaigns` and `GET /campaigns/:id` return the full campaign row to creators. The row holds `escrowFundedAmount`, `escrowAllocatedAmount`, `fundingPaymobOrderId`, and `fundingRequestedAmount`. | `CampaignsService.listLive` and `CampaignsService.findOne` | S |
| BG-06 | `POST /creators/me/payout-requests` takes an inline `{ amount, method }` type with no class-validator DTO. The service does not check the amount against the balance or against open requests. | `apps/api/src/modules/creators/creators.controller.ts`, line 103, `CreatorsService.requestPayout` | M |
| BG-07 | `useDeletePortfolioItem` calls `DELETE /creators/me/portfolio-items/:id`. That route does not exist. | `apps/web/src/hooks/api/useCreator.ts`, line 58, against `creators.controller.ts` | S |

## Money words with two meanings

`CLAUDE.md` asks for one name for one thing. The studio and the API disagree on three words.

| Word | Studio meaning | API meaning today | Recommended rule |
|---|---|---|---|
| Spend (brand dashboard hero) | Money released to creators. `WALLET.spent` equals "Released" in the billing hero. | `month.spend` in `DashboardService` is charges minus refunds this month. That is money funded. | Pick one. Recommendation: "Funded this month" for the existing number. Add "Released" through BG-08. |
| Allocated (billing hero) | Money held for creators and not yet released. Funded minus released minus allocated equals available. | `campaigns.escrow_allocated_amount` only grows. A release does not lower it. Available equals funded minus allocated minus refunded. | Show "Allocated, not released" as allocated minus released. Never subtract released and allocated both from funded. |
| Pending and Available (creator earnings) | In escrow, then Pending (clears after 7 days), then Available. Cleared minus paid out equals available. | `escrowBalance` (held), `pendingBalance` (released, no payout yet), `clearedBalance` (sum of payouts). | Map API `pendingBalance` to "Available". Map API `clearedBalance` to "Paid out". Hide the studio "Pending" cell until a clearance rule exists (BG-27). |

## Role aware UI

The web app does not know the brand team role of the signed-in user. `RolesGuard` gives only `brand`, `creator`, or `admin`. The API enforces `owner`, `approver`, and `viewer` through `BrandRoleGuard`. Today a `viewer` sees Accept, Approve, Fund, and Close buttons and gets a 403 on click.

- `GET /brands/me/members` already marks the caller row (`isCaller` logic in `BrandMembersService.list`). The web can derive the role from it. That is API-ONLY today.
- BG-11 adds `memberRole` to the `GET /brands/me` response. This is the cleaner path. Size S.
- The web needs one `useBrandRole()` hook and one `can(action)` helper. Every brand screen uses it. Size S.

## Ledger Mono against DESIGN.md

`DESIGN.md` and `CLAUDE.md` state `radius.xl` 18px for cards and `radius.lg` 12px for buttons. Ledger Mono sets card radius 14, hero radius 16, button radius 10, chip radius 8, and badge radius 4. The user picked Ledger Mono for the web. `DESIGN.md` section 7 must gain a "Ledger Mono web finish" subsection before Phase W1 closes, so a later agent does not revert the radii. Mobile keeps C3 Sage radii. Decision Q1 confirms that Ledger Mono is for the web only.

## Arabic and RTL rules for Ledger Mono

1. JetBrains Mono has no Arabic glyphs. Numbers, references, and dates stay in JetBrains Mono. Arabic words in overlines and badges fall back to IBM Plex Sans Arabic.
2. Uppercase and letter spacing break Arabic letter joining. Set `letter-spacing: 0` and `text-transform: none` under `:lang(ar)` for overlines, badges, tags, and table headers.
3. Wrap every amount, reference, and phone number in an isolated LTR span (`<bdi>` or `dir="ltr"`). "EGP 3,200.00" must not reorder in RTL.
4. Mirror chevrons, back arrows, the pipeline arrow, and steppers. Do not mirror the in and out ledger icons. They show money direction, not reading direction.
5. Use logical CSS only (`inset-inline`, `padding-inline`, `text-align: start`). `CON-W1-001` already forbids physical properties.
6. Font weights stay 400 and 500 only.

## Web money helper

Decision 5 forbids `parseFloat` on amounts. The web pages call `Number()` on amounts today (`brand/briefs/new/page.tsx`, `brand/briefs/[id]/fund/page.tsx`, `creator/earnings/page.tsx`). Ledger Mono also shows two decimals on every amount ("EGP 3,200.00"). `formatAmount` in `apps/web/src/utils/format.ts` drops ".00" today.

- Add `apps/web/src/utils/money.ts` with `toCents` and `centsToAmount` that match `apps/api/src/common/utils/money.ts`. Size S.
- Change `formatMoney` to always print two decimals. Size S.
- Every derived money number in this document (running balance, escrow impact, sums) uses integer cents.

---

# Screen Summary

| # | Screen | Pick | Route | Priority | Recommendation | Page verdict | Top gap |
|---|---|---|---|---|---|---|---|
| 1 | Brand dashboard | C Pipeline | `app/brand/dashboard` | P0 | BUILD WITH EXISTING DATA | REPLACE | BG-08 monthly series and brand escrow totals |
| 2 | Proposals per brief | A Split inbox | `app/brand/briefs/[id]/proposals` | P0 | BUILD WITH EXISTING DATA | REPLACE | BG-22 accept quote with platform fee |
| 3 | Creator earnings | A Bank statement | `app/creator/earnings` | P0 | BUILD WITH EXISTING DATA | REPLACE | BG-06 payout request validation |
| 4 | Creator home | A Task queue | `app/creator/home` | P0 | BUILD WITH EXISTING DATA | REPLACE | BG-29 confirm product received |
| 5 | Brief detail | B Brief document | `app/brand/briefs/[id]` | P0 | BUILD WITH EXISTING DATA | REPLACE | BG-15 funded date and hired count |
| 6 | Deliverable review | A Player and decision | `app/brand/deliverables/[id]/review` | P0 | BUILD WITH EXISTING DATA | REPLACE | BG-31 revision limit |
| 7 | New brief | B One page | `app/brand/briefs/new` | P0 | BUILD WITH EXISTING DATA | REPLACE | BG-17 format field decision |
| 8 | Briefs list | A Table | `app/brand/briefs` | P1 | BUILD WITH EXISTING DATA | REPLACE | BG-15 hired and new counts |
| 9 | Fund escrow | B Receipt | `app/brand/briefs/[id]/fund` | P0 | NEEDS BACKEND FIRST | REPLACE | BG-14 fund price times slots |
| 10 | Brand billing | A Escrow statement | `app/brand/billing` | P1 | NEEDS BACKEND FIRST | REPLACE | BG-09 and BG-10 ledger rows and counters |
| 11 | Collaboration | A Timeline | `app/brand/collaborations/[id]` | P1 | BUILD WITH EXISTING DATA | REPLACE | BG-29 received step |
| 12 | Chats | B Two panes | `app/brand/chats`, `app/chats/[collaborationId]` | P1 | BUILD AS DESIGNED | REPLACE | Route merge (frontend only) |
| 13 | Creator discover | A Filters and list | `app/creator/discover` | P0 | BUILD WITH EXISTING DATA | REPLACE | BG-16 filters, sort, proposal count |
| 14 | Brief and apply | B Form and brand preview | `app/creator/discover/[id]` | P0 | BUILD WITH EXISTING DATA | REPLACE | BG-25 creator self stats |
| 15 | Work detail | A Job sheet | `app/creator/work/[id]` | P0 | BUILD WITH EXISTING DATA | REPLACE | BG-30 due date |
| 16 | Creator profile | A Editor and preview | `app/creator/profile` | P1 | BUILD WITH EXISTING DATA | REPLACE | BG-07 portfolio delete route |
| 17 | Notifications | C Activity ledger | `app/notifications` | P1 | BUILD AS DESIGNED | REPLACE | BG-38 "new brief for you" event (deferred) |
| 18 | All proposals | C Brief cards | `app/brand/proposals` | P2 | BUILD WITH EXISTING DATA | REPLACE | BG-15 proposal stats per brief |
| 19 | Creator work list | A Table | `app/creator/work` | P1 | BUILD WITH EXISTING DATA | REPLACE | BG-30 and BG-31 due and revisions |
| 20 | Creator proposals | B Funnel and groups | `app/creator/proposals` | P2 | BUILD AS DESIGNED | REPLACE | BG-23 campaign close date |
| 21 | Brand profile | A Editor and preview | `app/brand/profile` | P2 | BUILD WITH EXISTING DATA | REPLACE | Members hooks (API-ONLY) and BG-12 stats |
| 22 | Settings | C Compact list | `app/settings` | P2 | BUILD WITH EXISTING DATA | REPLACE | BG-39 user name and locale |
| 23 | Login | B Centered card | `app/(auth)/login` | P0 | BUILD WITH EXISTING DATA | REPLACE | BG-01 fixed OTP |

"REPLACE" applies to the page layout (JSX and styles). The data hooks the page calls today stay unless the screen section says EXTEND or NEW.

---

# Screen Assessments

## 1. Brand dashboard: C Pipeline (`dashC`)

**Value**: The brand sees money this month, where each brief is in its life, and what needs action. The pipeline turns a list of briefs into one view of work in progress. **Priority**: P0.

**Page verdict**: REPLACE. Today the page uses `useBrandDashboard` and `useUnreadCount`. The pick adds `useMyBriefs`.

| Data point or action | Source today | Status |
|---|---|---|
| Brand name, logo initials, greeting | `GET /brands/me/dashboard` `brandName`, `logoUrl`, hook `useBrandDashboard` | AVAILABLE |
| Bell with unread count | `GET /notifications/unread-count`, hook `useUnreadCount` | AVAILABLE |
| "New brief" buttons | Route `/brand/briefs/new` | AVAILABLE |
| Hero amount "This month" | `month.spend` (charges minus refunds this month) | AVAILABLE, but see "Money words with two meanings" |
| "9 deliverables received" | `month.deliverableCount` (approved deliverables created this month) | AVAILABLE. Label must say "approved". |
| "EGP X still in escrow" (all briefs) | No brand total. Sum of `escrowFundedAmount` minus `escrowAllocatedAmount` minus `escrowRefundedAmount` over `GET /campaigns/mine` items (`BriefListItem` spreads the campaign row), `perPage` up to 100 | DERIVABLE for 100 briefs or fewer. BG-08 for a server total. |
| "Add funds" | No brand wallet exists. Escrow lives on the campaign (decision 1). | Relabel to "Fund a brief" and link to the briefs list |
| 6 month bar chart | No series endpoint | MISSING (BG-08) |
| Pipeline: 5 stages, counts, brief names | `GET /campaigns/mine` `status`, `collaborationStatus` (latest collaboration only), hook `useMyBriefs` | DERIVABLE. Draft = `draft`. Live = `live` or `paused` with no collaboration. In production = collaboration `funded`, `shipped`, or `revision_requested`. In review = `delivered`. Completed = `completed` or `cancelled`. |
| "Needs your action" rows | `attention.briefsNeedingProposalReview`, `attention.deliverablesAwaitingReview` for counts. Brief names from `useMyBriefs`. "Brief is not funded" = `draft` with `escrowFundedAmount` of `0.00`. | AVAILABLE for counts, DERIVABLE for names |
| Shortcut tiles with counts and keys N, P, R, W | Sum of `proposalCount`, `attention.deliverablesAwaitingReview` | DERIVABLE. Keys are frontend only. |

**Gaps**

- Frontend: dark grid paper `Hero` (S), `BarChart` (M), `Pipeline` (M), `ActionRow` list (S), `ShortcutTile` and a keyboard shortcut hook (S), pure derive helpers for stages and attention (S).
- Backend: BG-08 monthly series of funded and released amounts plus brand totals for funded, allocated, released, refunded, and available (S).

**Recommendation**: BUILD WITH EXISTING DATA. Hide the bar chart until BG-08 ships. Label the hero "Funded this month" until the user answers Q3. Derive "still in escrow" from `useMyBriefs` and fetch with `perPage=100`.

**Notes**: The dashboard route allows `owner`, `approver`, and `viewer`. Hide "New brief" and "Fund a brief" for `viewer` (role aware UI). The pipeline uses the latest collaboration only. A brief with two creators in different stages shows the latest one. In RTL the pipeline reads right to left and the stage arrows mirror. Add unit tests for the stage derive helper in `apps/web/src/__tests__`.

---

## 2. Brand proposals per brief: A Split inbox (`propA`)

**Value**: The brand compares creators without a popup. The escrow panel shows what accept does to the brief balance before the click. **Priority**: P0.

**Page verdict**: REPLACE. Hooks stay: `useCampaign`, `useCampaignProposals`, `useCreatorProfilePreview`, `useEscrowBalance`, `useUpdateProposalStatus`, `useAcceptProposal`.

| Data point or action | Source today | Status |
|---|---|---|
| Brief title, "4 received" | `GET /campaigns/:id` `title`, `GET /campaigns/:campaignId/proposals` `meta.total` | AVAILABLE |
| Escrow box: available, used of funded, meter | `GET /campaigns/:id/escrow` `funded`, `allocated`, `available`, hook `useEscrowBalance` | AVAILABLE |
| Status chips with counts | Proposal `status` over the list | DERIVABLE (fetch `perPage=100`) |
| List row: initials, name, city | List selects `creator.id`, `creator.displayName`, `creator.city` | AVAILABLE, initials DERIVABLE |
| List row: delivery days, price, status | `deliveryDays`, `price`, `status` | AVAILABLE |
| List row: approval percent | Only per proposal through `GET /proposals/:id/creator-profile` | MISSING in list (BG-21) |
| J and K keyboard navigation | None | Frontend only |
| Detail: jobs done, approval, average revisions | `GET /proposals/:id/creator-profile` `jobsDone`, `approvalRate`, `averageRevisions`, hook `useCreatorProfilePreview` | AVAILABLE |
| Detail: pitch | `proposal.pitch` | AVAILABLE |
| Detail: portfolio "3 of 12", clip durations | `portfolio` (newest 4 items, `mediaUrl`, `mediaType`). No total count, no duration. | AVAILABLE for items. MISSING total (BG-21) and duration (BG-36). |
| Tags: lowest price, fastest | Compare `price` and `deliveryDays` across open proposals | DERIVABLE |
| Tag: top approval | Needs approval for every row | MISSING (BG-21) |
| "If you accept": escrow now | `available` | AVAILABLE |
| "If you accept": this proposal, left after accept | `EscrowService.allocate` holds `totalAmount` (price plus platform fee). The web does not know the fee rate. | MISSING (BG-22) |
| Decline, Shortlist | `PATCH /proposals/:id/status`, hook `useUpdateProposalStatus` | AVAILABLE (see BG-02) |
| Accept | `POST /proposals/:id/accept`, hook `useAcceptProposal` | AVAILABLE |
| Message | Chat needs a collaboration. None exists before accept. | Show only for `accepted` |
| "Declined on Oct 27" | `updatedAt` | DERIVABLE |

**Gaps**

- Frontend: `SplitPane` (M), `ProposalListItem` (S), `StatCells` (S), `ImpactEquation` (S), comparison tag helper (S), keyboard list navigation hook (S).
- Backend: BG-21 creator stats and portfolio count per list row (M). BG-22 accept quote with `creatorPrice`, `platformFee`, `totalAmount` (S). BG-02 guard fix (S).

**Recommendation**: BUILD WITH EXISTING DATA. Drop the approval percent from list rows and hide the "Top approval" tag until BG-21. Show "Escrow now" only and hide "Left after accept" until BG-22. A price only subtraction would understate the hold by the platform fee.

**Notes**: Accept needs `owner` or `approver`. After BG-02, decline and shortlist need the same. Hide the action bar for `viewer`. Keep the existing insufficient escrow path (top up through `POST /campaigns/:id/escrow/top-up`). The impact math uses integer cents (decision 5). The accept still raises no second charge (decision 1). Add a test for the impact equation once BG-22 ships. RTL: the minus and equals signs in the impact panel stay in LTR order inside an isolated span.

---

## 3. Creator earnings: A Bank statement (`earnA`)

**Value**: The creator reads money in, money out, and a running balance like a bank statement. This builds trust in escrow. **Priority**: P0.

**Page verdict**: REPLACE. Hooks stay: `useCreatorEarnings`, `useCreatorLedger`, `useCreatorProfile`, `usePayoutDetails`, `useUpsertPayoutDetails`, `useRequestPayout`.

| Data point or action | Source today | Status |
|---|---|---|
| "Creator · name" | `GET /creators/me` `displayName` | AVAILABLE |
| Payout method card: method, account, holder | `GET /creators/:id/payout-details` `method`, `accountIdentifier`, `holderName`, hook `usePayoutDetails` | AVAILABLE |
| Processing time "1 to 3 business days" | None | Static copy |
| Last payout date and amount | Newest ledger row with `sign` of `−` | DERIVABLE |
| Edit payout method | `PUT /creators/me/payout-details`, hook `useUpsertPayoutDetails` | AVAILABLE |
| Request payout | `POST /creators/me/payout-requests`, hook `useRequestPayout` | AVAILABLE, unsafe (BG-06) |
| Hero "Available" | `GET /creators/me/earnings` `pendingBalance` (released, no payout yet) | AVAILABLE, rename |
| Hero "In escrow", "2 active jobs" | `escrowBalance`. Job count from `GET /collaborations/mine` statuses `funded` to `revision_requested`. | AVAILABLE, count DERIVABLE |
| Hero "Pending, clears Nov 01" | No clearance rule | MISSING (BG-27) |
| Equation: cleared minus paid out equals available | Paid out = `clearedBalance`. Cleared = `pendingBalance` plus `clearedBalance`. | DERIVABLE |
| Filter chips All, Earnings, Payouts | Ledger `sign` | DERIVABLE |
| Table: date | Ledger `meta` holds `YYYY-MM-DD · collaboration #id` as text | DERIVABLE by parsing. BG-26 adds ISO `createdAt`. |
| Table: description, brand | `title` ("Released · Brand", "Held · Brand", "Payout · method") | AVAILABLE. Brief title MISSING (BG-26). |
| Table: reference | Ledger `id` | DERIVABLE as a short id. BG-26 adds a stable reference. |
| Table: status badge | `status`, `statusToken` | AVAILABLE |
| Table: in and out amounts, in and out icon | `sign`, `amount` | AVAILABLE |
| Table: running balance | Sum oldest to newest. Release rows add. Payout rows subtract. Hold rows show "not in balance". | DERIVABLE in integer cents |

**Gaps**

- Frontend: `LedgerTable` with in and out icon cells (M), `Hero` with `KpiCells` and `Equation` (S), `MethodCard` (S), running balance helper (S).
- Backend: BG-06 payout request DTO, balance check, and `GET /creators/me/payout-requests` (M). BG-26 ledger fields (S). BG-27 clearance window (L, deferred).

**Recommendation**: BUILD WITH EXISTING DATA. Hide the "Pending" cell. Show a short ledger id as the reference. Ship the "Request payout" button only after BG-06. Until then show the button disabled with a short note, or keep the current form behind an ops check.

**Notes**: The ledger never returns `fee` rows to a creator. Keep that. `transactions` stays the only ledger (decision 2). The balance helper needs unit tests for the hold, release, and payout mix. Without a list of open payout requests, the creator can request the same money twice. BG-06 closes that. RTL: the In, Out, and Balance columns stay end aligned with isolated LTR amounts.

---

## 4. Creator home: A Task queue (`homeA`)

**Value**: The creator opens the app and sees what to do now, what comes next, and briefs that fit. Money stays visible on the side. **Priority**: P0.

**Page verdict**: REPLACE. Hooks stay: `useHomeQueue`, `useCreatorEarnings`, `useCreatorProfile`, `useUnreadCount`. Add `useLiveCampaigns` and `useMyProposals`.

| Data point or action | Source today | Status |
|---|---|---|
| Date, "Good evening, name" | `GET /creators/me` `displayName` | AVAILABLE |
| Bell count, "Discover briefs" | `useUnreadCount`, route | AVAILABLE |
| "Do now" and "Coming up" tasks: title, text, action | `GET /creators/me/queue` `urgentTasks`, `upcomingTasks` (`title`, `description`, `actionText`, `actionUrl`, `collaborationId`, `theme`), hook `useHomeQueue` | AVAILABLE |
| Task action routes | `actionUrl` holds mobile paths (`/chat/:id`, `/upload/:id`, `/shipment/:id`) | DERIVABLE. Map to web routes with `collaborationId`. |
| Due chip per task, "Sorted by deadline" | No due date | MISSING (BG-28, BG-30) |
| "Confirm product received" task | The queue emits it. No endpoint accepts the confirmation. | MISSING (BG-29) |
| "Waiting for brand reply" proposal task | `GET /proposals/mine` `status` `applied` or `shortlisted` | DERIVABLE |
| Briefs for you: title, brand, length, language, days left, budget | `GET /campaigns` `title`, `brand.companyName`, `durationSeconds`, `language`, `closesAt`, `budgetMin`, `budgetMax`, hook `useLiveCampaigns` | AVAILABLE |
| Briefs for you: match percent | None | MISSING (BG-20) |
| Briefs filtered by my niches | API takes one `niche` | DERIVABLE by client filter on `creator.niches` |
| Money card: available, in escrow, pending, request payout | `useCreatorEarnings` (same mapping as screen 3) | AVAILABLE |
| My proposals cells: applied, shortlisted, won | `useMyProposals` `status` | DERIVABLE |

**Gaps**

- Frontend: `TaskRow` with tone icon and due chip (S), task route mapper (S), `MoneyCard` (S), `KpiCells` (shared).
- Backend: BG-28 task `kind` and `dueAt` (S), BG-29 receipt confirmation (M), BG-20 match score (M, deferred).

**Recommendation**: BUILD WITH EXISTING DATA. Hide due chips and match tags. Route "Confirm product received" to the work detail page with a note until BG-29 ships. Sort tasks with urgent first, then by queue order.

**Notes**: The task route mapper needs a unit test. Do not build the mapper on string match of English titles. Map on the task `id` prefix (`msg-`, `rev-`, `deliv-`, `ship-`, `await-ship-`) until BG-28 adds a `kind` field. RTL: the due chip sits at the inline end.

---

## 5. Brand brief detail: B Brief document (`briefB`)

**Value**: The brand reads the brief as creators see it, with the escrow card and the life stage beside it. Pause and close sit on the same page. **Priority**: P0.

**Page verdict**: REPLACE. Hooks stay: `useCampaign`, `useCampaignProposals`, `useEscrowBalance`, `usePauseBrief`, `useResumeBrief`, `useCloseBrief`. Add `useMyCollaborations`, `useTopUpEscrow`, `useBrandProfile`.

| Data point or action | Source today | Status |
|---|---|---|
| Title, status badge | `GET /campaigns/:id` `title`, `status` | AVAILABLE |
| Reference "BR-2291" | Campaign `id` | DERIVABLE as a short id (Q7) |
| "Ends Nov 17 · 18 days left" | `closesAt` | AVAILABLE, days DERIVABLE |
| Pause and resume | `POST /campaigns/:id/pause`, `POST /campaigns/:id/resume` | AVAILABLE |
| Edit | `PATCH /campaigns/:id`, hook `useUpdateCampaign`. No edit page exists. | AVAILABLE for API. Frontend edit mode on the new brief page (M). |
| "Proposals · 3 new" | `useCampaignProposals` count of `applied` | DERIVABLE |
| Lifecycle: Created | `createdAt` | AVAILABLE |
| Lifecycle: Funded date | No `fundedAt` on the campaign | MISSING (BG-15). Mark the step done without a date when `escrowFundedAmount` is above zero. |
| Lifecycle: Live | `publishedAt` | AVAILABLE |
| Lifecycle: Creators hired "1 of 3" | `useMyCollaborations` filtered by `campaignId`, against `slots` | DERIVABLE |
| Lifecycle: Delivered, Closed | Collaboration `approved` or `paid`, campaign `status` and `closesAt` | DERIVABLE |
| Document: brand name | `GET /brands/me` `companyName` | AVAILABLE |
| Document: lead text | `brief` | AVAILABLE |
| Format list: deliverable, length, language, category, shipping, budget range | `videoType`, `durationSeconds`, `language`, `niche`, `needsShipping`, `budgetMin`, `budgetMax` | AVAILABLE |
| Talking points, Do not | `talkingPoints`, `doNotSay` | AVAILABLE |
| Escrow card with meter | `GET /campaigns/:id/escrow` | AVAILABLE |
| Fund more | `POST /campaigns/:id/escrow/top-up`, hook `useTopUpEscrow` | AVAILABLE |
| Proposals cell, Hired cell with name | Same as above | DERIVABLE |
| Close and refund | `POST /campaigns/:id/close`, hook `useCloseBrief` | AVAILABLE |

**Gaps**

- Frontend: `DocCard` (S), `HStepper` lifecycle bar (M, shared), `EscrowCard` with `Meter` (S, shared), edit mode for the new brief page (M).
- Backend: BG-15 adds `fundedAt` and `hiredCount` to the brief list and detail (part of an M item).

**Recommendation**: BUILD WITH EXISTING DATA. Show the Funded step without a date until BG-15. Ship Edit as a later step if the edit mode is not ready.

**Notes**: Close and Fund more need `owner`. Pause needs `owner` or `approver`. A `viewer` sees a read-only page. Close shows the refund amount from `available`, in cents. Brand label for `live` is "Open" in the status glossary. The studio badge says "Live". See Q6. RTL: the lifecycle bar runs right to left.

---

## 6. Deliverable review: A Player and decision (`revA`)

**Value**: The brand watches the video, checks it against the brief, and approves or asks for a revision in one place. The release amount shows before the click. **Priority**: P0.

**Page verdict**: REPLACE. Hooks stay: `useDeliverablePlayUrl`, `useReviewDeliverable`. Add `useCollaboration`, `useCollaborationDeliverables`, `useCampaign`.

| Data point or action | Source today | Status |
|---|---|---|
| Brief title, creator name | `GET /collaborations/:id` `campaign.title`, `creator.displayName` | AVAILABLE |
| "Deliverable 2 of 3" | Unclear. It can mean version 2, or slot 2 of `slots`. | Unclear (Q8) |
| "Auto-approves in 2 days" | No auto approve | MISSING (BG-32, deferred) |
| Message | Route `/chats/:collaborationId` | AVAILABLE |
| Player with version label | `GET /deliverables/:id/play-url`, hook `useDeliverablePlayUrl` | AVAILABLE |
| Version toggle V1, V2 with dates | `GET /collaborations/:id/deliverables` `version`, `createdAt`, hook `useCollaborationDeliverables` | AVAILABLE |
| Brief checklist items | `talkingPoints` from `GET /campaigns/:id` | AVAILABLE |
| Checklist "Met" or "Missing" per item, "4 / 5" | Not stored | MISSING (BG-37, deferred) |
| "Revisions used 1 of 2" | Used = count of deliverables with `revision_requested`. No limit. | Used DERIVABLE. Limit MISSING (BG-31). |
| "Release to creator" amount | `creatorPrice` (to creator) and `totalAmount` (leaves escrow) | AVAILABLE |
| Note for the creator on approve | `ReviewDeliverableDto.feedback` is ignored for `approve` | MISSING (BG-34) |
| Approve and release | `POST /deliverables/:id/review` `action: approve`, hook `useReviewDeliverable` | AVAILABLE |
| Revision reason chips | No field | DERIVABLE as a text prefix in `feedback`. BG-35 for a structured field. |
| Revision text, Request revision | `action: request_revision`, `feedback` required | AVAILABLE |

**Gaps**

- Frontend: `VideoPlayer` with version segment control (M), `Checklist` (S), `DecisionCard` with `ReleaseRow` (S), reason chip group (S).
- Backend: BG-31 revision limit (M), BG-34 approve note (S), BG-35 reasons (S, optional), BG-37 checklist state (M, deferred), BG-32 auto approve (L, deferred).

**Recommendation**: BUILD WITH EXISTING DATA. Hide the auto approve chip and the "of 2" limit. Show the checklist as a review aid that the page does not save, with no "Met" count. Hide the approve note field until BG-34. Put reason chips into the feedback text.

**Notes**: Review needs `owner` or `approver`. `BrandRoleGuard` enforces it. Hide the decision card for `viewer`. The API also supports `decline`. The pick does not show it. Keep it in an overflow menu so the action stays reachable (Q9). The release moves money that the brand already funded. The page must say "No new charge" (decision 1). The video caption is part of the file. RTL: the player controls do not mirror.

---

## 7. New brief: B One page (`newB`)

**Value**: The brand fills a short brief in any order and sees how creators will see it. One page is faster than a four step wizard. **Priority**: P0.

**Page verdict**: REPLACE. The current page is a four step wizard (`step` state). Hook stays: `useCreateCampaign`.

| Data point or action | Source today | Status |
|---|---|---|
| Title | `CreateCampaignDto.title` (3 to 140 chars) | AVAILABLE |
| Category | `niche` enum: `beauty_personal_care`, `fashion`, `mom_baby`, `food_fmcg`, `home_lifestyle`, `other` | AVAILABLE. Studio labels (Fitness, Tech, Kids) do not exist (BG-18, Q4). |
| Ships product to creator | `needsShipping` | AVAILABLE |
| Format chips: Instagram Reel, TikTok, Story, Unboxing | `videoType` holds `unboxing`, `testimonial`, `demo`, `tutorial`, `other`, `talking_head`, `try_on`. No platform field. | Conflict (BG-17, Q5) |
| Length 15s, 30s, 45s, 60s | `durationSeconds` (5 to 600) | AVAILABLE |
| Language | `language` `ar` or `en` | AVAILABLE |
| Brief and talking points text | `brief` (up to 4000), `talkingPoints` (array) | AVAILABLE. Split lines into the array. |
| Budget min and max, range slider | `budgetMin`, `budgetMax` (100 to 1,000,000) | AVAILABLE |
| "Typical for 30s Arabic reels" benchmark | None | MISSING (BG-19, deferred) |
| Section complete marks, "2 / 3 done" | Form state | Frontend only |
| Summary card, creator preview card | Form state | Frontend only |
| "Review and fund escrow" | `POST /campaigns` creates a `draft`, then route to `/brand/briefs/:id/fund` | AVAILABLE |

**Gaps**

- Frontend: `SectionCard` with number and done mark (S), `SegmentedControl` (S, shared), `OptionTiles` (S), `RangeSlider` (M), `BriefPreviewCard` (S), React Hook Form and Zod schema that mirrors `UpdateCampaignDto` limits (S).
- Backend: BG-17 format field (M, decision), BG-18 niche values (M, decision), BG-19 benchmark (L, deferred).

**Recommendation**: BUILD WITH EXISTING DATA. Use the 6 existing niche values. Map the format chips to existing `videoType` values until Q5 is answered. Hide the benchmark line.

**Notes**: Create needs `owner` or `approver`. The pick has no field for `slots`, `closesAt`, or `doNotSay`. Discover shows "days left" from `closesAt`. The brief detail shows "Do not". See Q10. Range slider handles must move with the reading direction in RTL. Budget numbers stay LTR.

---

## 8. Brand briefs list: A Table (`listA`)

**Value**: The brand scans all briefs, their state, proposals, hires, and escrow use in one table. **Priority**: P1.

**Page verdict**: REPLACE. Hook stays: `useMyBriefs`.

| Data point or action | Source today | Status |
|---|---|---|
| Search briefs with "/" key | No `q` parameter on `GET /campaigns/mine` | DERIVABLE as a client filter on the loaded page. BG-15 for server search. |
| New brief | Route | AVAILABLE |
| Chips All, Open, Draft, Completed with counts | `counts.all`, `counts.open`, `counts.draft`, `counts.completed` | AVAILABLE |
| Title, next step text | `title`, plus `status` and `collaborationStatus` | AVAILABLE, next step DERIVABLE |
| Status badge (Live, In review, In production, Draft, Completed) | `status` and `collaborationStatus` | DERIVABLE as a display stage |
| Proposals count | `proposalCount` (applied plus shortlisted) | AVAILABLE |
| "+3 new" tag | No split of applied and shortlisted | MISSING (BG-15) |
| Hired avatar stack and count | Only `acceptedCreatorName` of the latest collaboration | MISSING (BG-15) |
| Escrow used bar "3.0K / 15.0K" | `escrowAllocatedAmount` over `escrowFundedAmount` | DERIVABLE in cents |
| Ends | `closesAt` | AVAILABLE |

**Gaps**

- Frontend: `DataTable` (M, shared), `MiniBar` (S), `AvatarStack` (S), search box with key shortcut (S).
- Backend: BG-15 list enrichment and search (M).

**Recommendation**: BUILD WITH EXISTING DATA. Show one avatar from `acceptedCreatorName` until BG-15. Hide "+N new". Search filters the loaded page only.

**Notes**: `viewer` can read the list. The table needs a card list fallback below 768px. RTL: numeric columns stay end aligned.

---

## 9. Fund escrow: B Receipt (`fundB`)

**Value**: The brand sees exactly what it pays and why, as a receipt, then pays once for the whole brief. **Priority**: P0.

**Page verdict**: REPLACE. Hooks stay: `useCampaign`, `useEscrowBalance`, `useFundEscrow`, `usePublishCampaign`. Add a manual payment hook (NEW).

| Data point or action | Source today | Status |
|---|---|---|
| Total to fund | `fundEscrow` accepts an amount between `budgetMin` and `budgetMax` only. The default is the midpoint. | Conflict (BG-14) |
| Brief title, brand name | `GET /campaigns/:id` `title`, `GET /brands/me` `companyName` | AVAILABLE |
| Format line "Reel · 30s · Arabic" | `videoType`, `durationSeconds`, `language` | AVAILABLE |
| Budget range | `budgetMin`, `budgetMax` | AVAILABLE |
| Price used (midpoint) | Midpoint of the range in cents | DERIVABLE |
| Videos "× 3" | `slots` (1 to 50) | AVAILABLE. The API rejects a total above `budgetMax` (BG-14). |
| Pay with card "Corporate card •• 4471" | `POST /campaigns/:id/escrow/checkout` returns a Paymob `checkoutUrl`. No saved cards. | AVAILABLE for checkout. Saved card MISSING (BG-41, deferred). |
| Pay by bank transfer | `FundEscrowDto.method` accepts `bank_transfer` but `fundEscrow` always opens Paymob. `POST /campaigns/:id/escrow/manual-payment` takes `instapay` or `vodafone_cash` with a reference. | API-ONLY for InstaPay and Vodafone Cash. Bank transfer is not real. |
| Fund and publish | Checkout, then `POST /campaigns/:id/publish` | AVAILABLE |
| "Held in escrow" note | Static | Frontend only |

**Gaps**

- Frontend: `Receipt` with tear lines (M), `RadioCard` (S), manual payment form and hook (M).
- Backend: BG-14 fund amount rule (M). BG-04 role alignment (S). BG-41 saved methods (L, deferred).

**Recommendation**: NEEDS BACKEND FIRST. The receipt's main number is price times videos. The API rejects that number today. Until BG-14 ships, keep the current fund page and only restyle it. Replace "Bank transfer" with "InstaPay or Vodafone Cash" through the manual payment endpoint, and show "Card (Paymob)" without a saved card label.

**Notes**: Checkout needs `owner`. BG-04 aligns manual payment to `owner`. The total uses integer cents. `FundEscrowDto.amount` is a number today. Send it from cents divided by 100 with two decimals. BG-14 touches `campaigns.service.spec.ts` and `escrow.service.spec.ts`. Ledger invariant 1 in `00_overview.md` must still hold. The manual path needs admin verification through `POST /admin/campaigns/:id/verify-escrow`, so the copy must say "Goes live after we check the transfer".

---

## 10. Brand billing: A Escrow statement (`billA`)

**Value**: The brand sees every money movement on one statement with funded, released, allocated, and available totals that add up. **Priority**: P1.

**Page verdict**: REPLACE. Hook `useBilling` EXTENDS for the new summary and filter.

| Data point or action | Source today | Status |
|---|---|---|
| Brand name overline | `GET /brands/me` `companyName` | AVAILABLE |
| Payment methods button | No saved methods | MISSING (BG-41, deferred) |
| Fund a brief | Route to briefs list | AVAILABLE |
| Hero: Funded, Released, Allocated, Available | `GET /brands/me/billing` `summary.lifetimeSpend` only (charges minus refunds) | MISSING (BG-09). Funded, allocated, refunded are DERIVABLE from `useMyBriefs` sums. Released is not. |
| Equation line | Same counters | MISSING (BG-09) |
| Ledger rows: Funded, Refunded | `items` with `type` `charge` or `refund`, `label`, `campaignTitle`, `method`, `amount` (signed), `createdAt` | AVAILABLE |
| Ledger rows: Allocated to creator, Released to creator | `BillingService.list` filters to `charge` and `refund` only | MISSING (BG-10) |
| Reference | `id` | DERIVABLE as a short id |
| Type chips with counts | No `type` filter | DERIVABLE on the loaded page. BG-10 adds a server filter. |

**Gaps**

- Frontend: `LedgerTable` (shared), `Hero` with `KpiCells` and `Equation` (shared).
- Backend: BG-09 summary counters (S). BG-10 hold and release rows with creator name, and a `type` filter (M).

**Recommendation**: NEEDS BACKEND FIRST. The core value is a statement where the totals reconcile. Today the API shows only charge and refund rows and one total. Ship BG-09 and BG-10, then build. If the user wants an earlier ship, restyle the current page with charge and refund rows only and hide the hero cells.

**Notes**: Billing needs `owner` or `approver`. A `viewer` gets 403. Hide the Billing nav item for `viewer`. The API signs a charge as negative and a refund as positive (brand pocket view). The studio signs funded as positive and refund as negative (escrow view). See Q11. BG-10 changes `billing.service.spec.ts`. Allocated in the hero must be allocated minus released (see "Money words with two meanings").

---

## 11. Brand collaboration: A Timeline (`collabA`)

**Value**: The brand sees each step of one job with dates, and the money and shipment beside it. The current step carries the next action. **Priority**: P1.

**Page verdict**: REPLACE. Hooks stay: `useCollaboration`, `useCollaborationDeliverables`, `useConfirmShipment`. Add `useCreatorProfilePreview`.

| Data point or action | Source today | Status |
|---|---|---|
| Creator name, initials | `GET /collaborations/:id` `creator.displayName` | AVAILABLE |
| Status badge "V2 submitted" | `status` and latest deliverable `version` | DERIVABLE |
| Brief title, "deliverable 2 of 3" | `campaign.title`. Second part is unclear. | AVAILABLE, unclear part (Q8) |
| Chat, Review V2 | Routes. Review uses the latest `submitted` deliverable id. | DERIVABLE |
| Step: proposal accepted, amount allocated | `createdAt`, `creatorPrice` or `totalAmount` | AVAILABLE |
| Step: product shipped, carrier, tracking | `shipmentConfirmedAt`, `shipmentCarrier`, `shipmentTrackingNumber` | AVAILABLE |
| Step: product received | No creator receipt | MISSING (BG-29) |
| Step: version submitted, duration, size | Deliverable `createdAt`, `durationSeconds`. No file size. | AVAILABLE, size MISSING (BG-36) |
| Step: revision requested with text | Deliverable `feedback[].body`, `createdAt` | AVAILABLE |
| Step: approved and paid with date | `status` `approved` or `paid`. No dates. | Status AVAILABLE, dates MISSING (BG-33) |
| "6 of 7 steps" | Steps done | DERIVABLE |
| Money card: in escrow, revisions used 1 of 2 | `totalAmount` or `creatorPrice`. Used count DERIVABLE. Limit missing. | AVAILABLE, limit MISSING (BG-31) |
| Shipment card "Delivered" badge, received date | `physicalShipmentTracking` flag is off. No received date. | MISSING (BG-29) |
| Creator stats: jobs, approval, average revisions | `GET /proposals/:proposalId/creator-profile` with `collaboration.proposalId` | AVAILABLE |
| Confirm shipment form (not in pick, still needed when `funded` and `needsShipping`) | `POST /collaborations/:id/confirm-shipment`, hook `useConfirmShipment` | AVAILABLE |

**Gaps**

- Frontend: `VerticalTimeline` (M, shared), `KeyValueList` (S), keep the shipment form as a timeline step action (S).
- Backend: BG-29 (M), BG-31 (M), BG-33 (S), BG-36 (S, optional), BG-03 guard fix (S).

**Recommendation**: BUILD WITH EXISTING DATA. Hide the "Product received" step and the "Delivered" badge until BG-29. Hide the revision limit. Show approved and paid steps without dates.

**Notes**: Confirm shipment must need `owner` or `approver` after BG-03. The timeline is a view of collaboration status values from the glossary. Do not add new status words. RTL: the timeline rail sits at the inline start.

---

## 12. Chats: B Two panes (`chatB`)

**Value**: The brand keeps every conversation in one place. System lines for escrow, shipment, and versions sit inside the thread, so chat doubles as a job log. **Priority**: P1.

**Page verdict**: REPLACE for both `app/brand/chats/page.tsx` and `app/chats/[collaborationId]/page.tsx`. Hooks stay: `useChats`, `useMarkChatRead`, `useMessages`, `useSendMessage`. Add `useCollaboration`.

| Data point or action | Source today | Status |
|---|---|---|
| Chips Active, Closed with counts | `GET /chats` `collaborationStatus` (`approved`, `paid`, `cancelled` count as closed) | DERIVABLE |
| Search chats | Client filter on `counterpartName` and `campaignTitle` | DERIVABLE |
| List: avatar initials, name, brief, preview, time, unread | `counterpartInitials`, `counterpartName`, `campaignTitle`, `lastMessagePreview`, `lastMessageAt`, `unreadCount`, hook `useChats` | AVAILABLE |
| Thread head: name, brief, status badge | Chat item fields | AVAILABLE |
| Thread head: amount | `GET /collaborations/:id` `creatorPrice` | DERIVABLE |
| Thread: user and system messages | `GET /collaborations/:id/messages` `kind`, `event`, `body`, `sentAt`, hook `useMessages`. The current page already renders system lines. | AVAILABLE |
| Composer, send | `POST /collaborations/:id/messages`, hook `useSendMessage` | AVAILABLE |
| Mark read | `POST /collaborations/:id/read`, hook `useMarkChatRead` | AVAILABLE |

**Gaps**

- Frontend: `SplitPane` (shared), `ConversationListItem` (S), `SystemLine` dashed divider (S), route merge so `/brand/chats` shows both panes and `/chats/[collaborationId]` opens with that thread selected (M).
- Backend: none.

**Recommendation**: BUILD AS DESIGNED.

**Notes**: `ablyWebsockets` is off. The thread keeps the current polling. The creator has no chat list route. See Q12. Below 768px show one pane at a time. RTL: own bubbles align at the inline end. Times stay in mono LTR.

---

## 13. Creator discover: A Filters and list (`discA`)

**Value**: The creator narrows open briefs by niche, budget, and length, then scans a dense list. This shortens the path from browse to apply. **Priority**: P0.

**Page verdict**: REPLACE. Hook `useLiveCampaigns` EXTENDS with the new filter parameters after BG-16.

| Data point or action | Source today | Status |
|---|---|---|
| "6 open briefs match your niches" | `GET /campaigns` `meta.total` | AVAILABLE |
| Search brands or briefs | No search parameter | MISSING (BG-16) |
| Niche checkboxes with counts, multi select | `QueryCampaignDto.niche` takes one value. No counts. | Single select AVAILABLE. Multi select and counts MISSING (BG-16). |
| Budget range | `minBudget` only (against `budget_max`) | Min AVAILABLE, max MISSING (BG-16) |
| Length filter | None | MISSING (BG-16) |
| Ships product filter | None | MISSING (BG-16) |
| Arabic only | `language` | AVAILABLE |
| Clear filters | Client state | Frontend only |
| Sort by match, budget, ending soon | Server orders by `createdAt` DESC | MISSING (BG-16, BG-20) |
| Row: brand, niche, title | `brand.companyName`, `niche`, `title` | AVAILABLE |
| Row: length, language, ships product, days left | `durationSeconds`, `language`, `needsShipping`, `closesAt` | AVAILABLE |
| Row: proposals count, "Few proposals" tag | None | MISSING (BG-16) |
| Row: budget range | `budgetMin`, `budgetMax` | AVAILABLE |
| Row: match percent | None | MISSING (BG-20, deferred) |

**Gaps**

- Frontend: `FilterPanel` with checkbox rows, range, and segment (M), `ListRow` dense variant (S), URL query state for filters (S).
- Backend: BG-16 filters, sort, search, and proposal count (M). BG-05 public columns only (S). BG-20 match (M, deferred).

**Recommendation**: BUILD WITH EXISTING DATA. Ship niche as a single select, language, and minimum budget. Hide search, length, shipping, sort, proposal count, the "Few proposals" tag, and match.

**Notes**: BG-05 must ship before or with this screen, because the list sends escrow counters to creators today. Filter labels need Arabic copy for each niche value. RTL: the filter panel sits at the inline start.

---

## 14. Creator brief and apply: B Form and brand preview (`applyB`)

**Value**: The creator writes a proposal and sees how the brand will see it. That pushes better pitches and fair prices. **Priority**: P0.

**Page verdict**: REPLACE. Hooks stay: `useCampaign`, `useCreateProposal`. Add `useCreatorProfile` and `useMyProposals`.

| Data point or action | Source today | Status |
|---|---|---|
| Brief title, brand | `GET /campaigns/:id` `title`, `brand.companyName` | AVAILABLE |
| Spec strip: format, length, language, budget, closes | `videoType`, `durationSeconds`, `language`, `budgetMin`, `budgetMax`, `closesAt` | AVAILABLE |
| Spec strip: "Ships product · Yes, to your city" | `needsShipping`, creator `city` | AVAILABLE |
| Read full brief | `brief`, `talkingPoints`, `doNotSay` in a drawer | AVAILABLE |
| Your price, "inside the brand range" hint | Form, compared with `budgetMin` and `budgetMax` | DERIVABLE |
| Delivery days segment 3, 5, 7, 10 | `CreateProposalDto.deliveryDays` (1 to 90) | AVAILABLE |
| Pitch with "168 / 600" counter | `pitch` has `MinLength(1)` and no max | Counter frontend only. Max MISSING (BG-24). |
| Submit proposal | `POST /campaigns/:campaignId/proposals`, hook `useCreateProposal` | AVAILABLE |
| Already applied state | `useMyProposals` filtered by campaign id | DERIVABLE |
| Preview: name, city, days, price, Applied badge | Creator profile and form state | DERIVABLE |
| Preview: jobs, approval, average revisions | Brand only endpoint today | MISSING (BG-25) |
| Tips | Static | Frontend only |

**Gaps**

- Frontend: `SpecStrip` with `KpiCells` (S), proposal form with Zod schema (S), `ProposalPreviewCard` (S), pitch counter (S).
- Backend: BG-25 self stats (S), BG-24 pitch max (S), BG-05 (S).

**Recommendation**: BUILD WITH EXISTING DATA. Hide the stats row in the preview until BG-25. Cap the pitch at 600 on the client and add BG-24 so the API matches.

**Notes**: The API returns the full campaign row to the creator (BG-05). Price uses cents on the client. The price input stays LTR in RTL.

---

## 15. Creator work detail: A Job sheet (`workA`)

**Value**: The creator sees the job stage, the brand feedback, and the upload box on one sheet. Revisions get done faster. **Priority**: P0.

**Page verdict**: REPLACE. Hooks stay: `useCollaboration`, `useCollaborationDeliverables`, `useRequestDeliverableUploadUrl`, `useRegisterDeliverable`. Add `useCampaign`.

| Data point or action | Source today | Status |
|---|---|---|
| Title, brand, escrow amount, status badge | `GET /collaborations/:id` `campaign.title`, `brand.companyName`, `creatorPrice`, `status` | AVAILABLE |
| "Due tomorrow 18:00" chip | No due date. The collaboration payload has no `proposal.deliveryDays`. | MISSING (BG-30) |
| Chat with brand | Route `/chats/:collaborationId` | AVAILABLE |
| Stepper: accepted, V1 sent, revision, V2 sent | `createdAt`, deliverables, feedback | AVAILABLE |
| Stepper: product received | No receipt | MISSING (BG-29). Show "Shipped" from `shipmentConfirmedAt`. |
| Stepper: paid | `status` `paid`, no date | Status AVAILABLE, date MISSING (BG-33) |
| Feedback card with text and time | Latest `feedback[]` on the newest deliverable | AVAILABLE |
| "Revision 1 of 2" | Used DERIVABLE, limit missing | MISSING (BG-31) |
| Brief checklist with "Done in V1" or "Fix in V2" | Talking points AVAILABLE. Item state not stored. | MISSING (BG-37, deferred) |
| Upload dropzone | `POST /collaborations/:id/deliverables/upload-url`, R2 PUT, `POST /collaborations/:id/deliverables` | AVAILABLE |
| File types and size line | API checks content type and `MAX_UPLOAD_SIZE_MB` (default 500) | AVAILABLE. Copy must not say 250 MB. |
| Notes for the brand | `RegisterDeliverableDto.note` | AVAILABLE |
| Money list: in escrow, paid when approved | `creatorPrice` | AVAILABLE |
| "Auto-approve 3 days after you submit" | None | MISSING (BG-32, deferred) |

**Gaps**

- Frontend: `HStepper` (shared), `FeedbackCard` (S), `Dropzone` with progress and cancel (M), `Checklist` (shared).
- Backend: BG-30 (S), BG-29 (M), BG-31 (M), BG-33 (S).

**Recommendation**: BUILD WITH EXISTING DATA. Hide the due chip, the "of 2" limit, checklist states, and the auto approve line. Show "Shipped" in place of "Product received".

**Notes**: The API refuses uploads before shipment when `needsShipping` is true. The page must show that state. The R2 upload has a local test shortcut in mobile (AUD-003). Check that the web upload does not copy it. RTL: the dropzone text centers. Times stay LTR.

---

## 16. Creator profile: A Editor and preview (`profA`)

**Value**: The creator edits the profile and sees what brands see at the same time. A better profile wins more proposals. **Priority**: P1.

**Page verdict**: REPLACE. Hooks stay: `useCreatorProfile`, `useUpdateCreatorProfile`, `usePortfolioItems`, `useAddPortfolioItem`, `useDeletePortfolioItem`. Add `useRequestUploadUrl`.

| Data point or action | Source today | Status |
|---|---|---|
| Display name, city | `PATCH /creators/me` `displayName`, `city` | AVAILABLE |
| Base price and "Brands see from EGP 3,000.00" | `basePrice` | AVAILABLE |
| Niches chips | `niches` (6 enum values) | AVAILABLE. Studio has 7 labels (BG-18, Q4). |
| Portfolio grid | `GET /creators/me/portfolio-items` `mediaUrl`, `mediaType` | AVAILABLE |
| Add video | `POST /storage/upload-url` module `portfolio`, then `POST /creators/me/portfolio-items` | AVAILABLE |
| Remove video | Hook calls `DELETE /creators/me/portfolio-items/:id`. No such route. | MISSING (BG-07) |
| "6 of 12" limit | No limit in the service | MISSING. Hide the limit. |
| Clip durations | No duration field | MISSING (BG-36) |
| Save | `PATCH /creators/me` | AVAILABLE |
| Preview: name, city, from price, niches, 3 thumbs | Same data | AVAILABLE |
| Preview: jobs, approval, average revisions | Brand only endpoint today | MISSING (BG-25) |

**Gaps**

- Frontend: `EditorPreviewLayout` with sticky side (S), `Gallery` with add tile (S), `PublicProfileCard` (S).
- Backend: BG-07 (S), BG-25 (S), BG-36 (S, optional), BG-18 (M, decision).

**Recommendation**: BUILD WITH EXISTING DATA. Fix BG-07 first because the remove action fails today. Hide the stats row, the limit, and durations.

**Notes**: `basePrice` goes over the wire as a number today (`UpdateCreatorDto`). Build it from cents on the client. `vettingStatus` exists on the creator. The pick does not show it. See Q13. RTL: the preview card sits at the inline end.

---

## 17. Notifications: C Activity ledger (`notC`)

**Value**: Every event shows as one row in a ledger with type and amount. Money events are easy to audit. **Priority**: P1.

**Page verdict**: REPLACE. Hooks stay: `useNotifications`, `useMarkNotificationRead`, `useMarkAllNotificationsRead`. Add `useUnreadCount`.

| Data point or action | Source today | Status |
|---|---|---|
| "3 unread" | `GET /notifications/unread-count` `unread` | AVAILABLE |
| Mark all read | `POST /notifications/read-all` | AVAILABLE |
| When, unread dot | `createdAt`, `readAt` | AVAILABLE |
| Type badge: Money, Proposals, Work, Messages, Briefs | `event` from `NotificationEvent` | DERIVABLE with a category map |
| Event text | `event`, `params`. The web already has `notif.{role}.{event}` copy in `en.json` and `ar.json`. | AVAILABLE |
| Amount column | `params.total`, `params.creatorPrice`, or `params.amount` | DERIVABLE |
| Action button | `collaborationId` or `campaignId`. The current page already maps both to web routes. | DERIVABLE |
| "New brief for you" row | No such event. `brief_published` goes to the brand team only. | MISSING (BG-38, deferred) |

**Gaps**

- Frontend: `DataTable` (shared), category map (S), action label map (S).
- Backend: BG-38 (M, deferred). It needs a new catalog event in `packages/shared-types/src/notifications.ts`.

**Recommendation**: BUILD AS DESIGNED. The "new brief" row type never appears until BG-38.

**Notes**: Decision 4 allows one catalog only. Put the category map in `packages/shared-types/src/notifications.ts` next to the event union, so mobile and web share it. Do not create a second list in the web app. `deepLink` holds mobile stack names. The web ignores it and routes by ids. Add a test that every `NotificationEvent` has a category. RTL: the amount column stays end aligned.

---

## 18. Brand all proposals: C Brief cards (`hubC`)

**Value**: The brand sees which brief has new proposals and jumps to its inbox. Running collaborations sit below. **Priority**: P2.

**Page verdict**: REPLACE. Hooks stay: `useMyBriefs`, `useMyCollaborations`. Add `useCampaignProposals` per open brief.

| Data point or action | Source today | Status |
|---|---|---|
| "3 new since yesterday" | Proposal `createdAt` and `status` per brief | DERIVABLE with one proposals call per open brief |
| Card: status badge, title | `useMyBriefs` | AVAILABLE |
| Card: "+N new", total, shortlisted, lowest price, avatar stack | `GET /campaigns/:campaignId/proposals` per brief | DERIVABLE (N calls). BG-15 gives it in one call. |
| Open inbox, Fund | Routes. Fund for `draft` briefs. | AVAILABLE |
| Collaborations: name, brief, status, amount | `GET /collaborations/mine` `creator.displayName`, `campaign.title`, `status`, `creatorPrice` | AVAILABLE |

**Gaps**

- Frontend: `BriefProposalCard` (S), `AvatarStack` (shared), grouped section header with dashed rule (S).
- Backend: BG-15 (M).

**Recommendation**: BUILD WITH EXISTING DATA. Load proposal stats with one call per `live` or `paused` brief. Drafts need no call. Switch to BG-15 data when it ships.

**Notes**: The N call approach is fine for a few briefs. It is not fine above about 20 open briefs. `viewer` can read. Hide "New brief" and "Fund" for `viewer`.

---

## 19. Creator work list: A Table (`wlA`)

**Value**: The creator sees all jobs with money, due date, and next step in one table. **Priority**: P1.

**Page verdict**: REPLACE. Hook stays: `useMyCollaborations`. Add `useCreatorEarnings`.

| Data point or action | Source today | Status |
|---|---|---|
| "2 active · EGP in escrow" | Count from statuses. `escrowBalance` from `useCreatorEarnings`. | DERIVABLE and AVAILABLE |
| Browse briefs | Route | AVAILABLE |
| Chips Active, Completed, All with counts | `status` | DERIVABLE |
| Job title, brand | `campaign.title`, `brand.companyName` | AVAILABLE |
| Status badge | `status` mapped to a display stage | DERIVABLE |
| In escrow | `creatorPrice` while held | DERIVABLE |
| Due | No due date in the list payload | MISSING (BG-30) |
| Revisions "1 / 2" | No count in the list, no limit | MISSING (BG-31) |
| Next step and its button | `status` | DERIVABLE |

**Gaps**

- Frontend: `DataTable` (shared), `DueChip` (S).
- Backend: BG-30 (S), BG-31 (M).

**Recommendation**: BUILD WITH EXISTING DATA. Hide the Due and Revisions columns until BG-30 and BG-31.

**Notes**: Keep the display stage words in one map shared with screen 15 and screen 4. RTL: same table rules as screen 8.

---

## 20. Creator proposals: B Funnel and groups (`mpB`)

**Value**: The creator sees the win rate and which proposals still wait. This helps the creator price and pitch better. **Priority**: P2.

**Page verdict**: REPLACE. Hook stays: `useMyProposals`.

| Data point or action | Source today | Status |
|---|---|---|
| "6 sent · 2 won · 33% win rate" | `status` over `GET /proposals/mine` | DERIVABLE |
| Funnel: sent, shortlisted, won, declined | `status` | DERIVABLE |
| Group rows: title, brand | `campaign.title`, `brand.companyName` | AVAILABLE |
| Sent date | `createdAt` | AVAILABLE |
| "Closes in 18d" | `listMine` does not select `campaign.closesAt` | MISSING (BG-23) |
| Status badge, my price | `status`, `price` | AVAILABLE |

**Gaps**

- Frontend: `Funnel` (S), grouped section header (shared).
- Backend: BG-23 (S).

**Recommendation**: BUILD AS DESIGNED with BG-23. If BG-23 slips, hide "closes in".

**Notes**: "Shortlisted" counts the current status only. A proposal that moved from shortlisted to accepted counts as won. The status glossary gives the creator label "Pending" for both `applied` and `shortlisted`. The pick shows "Applied" and "Shortlisted" to the creator, and the creator already gets a `proposal_shortlisted` notification. See Q6. RTL: the funnel bars grow from the inline start.

---

## 21. Brand profile: A Editor and preview (`bpA`)

**Value**: The brand edits company facts, manages the team, and sees how creators see the brand in Discover. **Priority**: P2.

**Page verdict**: REPLACE. Hooks stay: `useBrandProfile`, `useUpdateBrandProfile`. Add NEW hooks for members and `useRequestUploadUrl`.

| Data point or action | Source today | Status |
|---|---|---|
| Company name, category, country | `PATCH /brands/me` `companyName`, `category`, `country` | AVAILABLE |
| Logo upload | `POST /storage/upload-url` module `brand_logo` (5 MB), then `PATCH /brands/me` `logoUrl` | AVAILABLE |
| Save | `PATCH /brands/me` (`owner` only) | AVAILABLE |
| Billing history link | Route | AVAILABLE |
| Team rows: name, role, description | `GET /brands/me/members` (`email`, `displayName` from the email name part, `role`, `status`) | API-ONLY |
| Invite, Edit role, Remove | `POST /brands/me/members`, `PATCH /brands/me/members/:id`, `DELETE /brands/me/members/:id` (`owner` only) | API-ONLY |
| Pending invite row with date, Resend | Invite row exists. No resend. | API-ONLY for the row. Resend MISSING (BG-13). |
| Preview: name, category, country | Same profile data | AVAILABLE |
| Preview: briefs count | `useMyBriefs` `counts.all` | DERIVABLE |
| Preview: hired count | `useMyCollaborations` `meta.total` | DERIVABLE |
| Preview: "Pays in 1.4d" | None | MISSING (BG-12) |

**Gaps**

- Frontend: `useBrandMembers`, `useInviteMember`, `useUpdateMemberRole`, `useRemoveMember` hooks (S), `TeamRow` (S), `BrandPreviewCard` (S), `EditorPreviewLayout` (shared).
- Backend: BG-13 resend (S), BG-12 public brand stats (M), BG-11 member role (S).

**Recommendation**: BUILD WITH EXISTING DATA. Show the team section only when `brandTeamManagement` is on in `apps/web/src/config/features.ts`. It is off by default. Hide "Pays in" and Resend.

**Notes**: Only `owner` can save and manage the team. Show a read-only form for `approver` and `viewer`. Brand roles stay in `brand_members` and `BrandRoleGuard` (decision 3). Do not read them from the JWT. `verificationStatus` and `businessDocumentUrl` exist. The pick does not show them. See Q13.

---

## 22. Settings: C Compact list (`setC`)

**Value**: The user changes language and reaches team, security, and billing in a few clicks, with log out at the end. **Priority**: P2.

**Page verdict**: REPLACE. The page uses `useAuthStore` and `useTranslation` today.

| Data point or action | Source today | Status |
|---|---|---|
| Identity: person name | `users` has no name column | MISSING (BG-39). Show brand `companyName` or creator `displayName`, else email. |
| Identity: "Owner · Nile Roast Coffee" | Caller row in `GET /brands/me/members` | API-ONLY, DERIVABLE |
| Profile link | Route | AVAILABLE |
| Language EN or AR | `setLocale` in the i18n provider | AVAILABLE on the client. Server save MISSING (BG-39, `users.locale` exists). |
| Direction "Follows language" | Static | Frontend only |
| Email, in app, and sound toggles | No preferences | MISSING (BG-40, deferred) |
| Team "3 members" | `GET /brands/me/members` | API-ONLY, brand only, behind `brandTeamManagement` |
| Security "Email code" | Auth store `email` | DERIVABLE |
| Billing "Card •• 4471" | No saved methods | MISSING (BG-41, deferred) |
| Log out | Today the web clears local state only. `POST /auth/logout` exists. | API-ONLY |

**Gaps**

- Frontend: `SettingsRow` (S), `Toggle` (S, for later), wire `POST /auth/logout` (S).
- Backend: BG-39 (M), BG-40 (M, deferred), BG-41 (L, deferred).

**Recommendation**: BUILD WITH EXISTING DATA. Hide all three toggles. Show "Billing" as a link without a card label. Call `POST /auth/logout` before the local clear so the refresh token stops working.

**Notes**: Creator settings show no Team or Billing rows. RTL: the language control shows "ع" and keeps its own direction.

---

## 23. Login: B Centered card (`logB`)

**Value**: A brand or creator signs in with an email address and a code sent by email, in two steps. Decision Q14 makes email OTP the only login code channel. **Priority**: P0.

**Page verdict**: REPLACE. The page calls `/auth/otp/send` and `/auth/otp/verify` and keeps a demo login.

| Data point or action | Source today | Status |
|---|---|---|
| Logo | Static | Frontend only |
| Stepper Email, Code | Form state | Frontend only |
| Role segment brand or creator | `SendOtpDto.role`, `VerifyOtpDto.role` | AVAILABLE |
| Email address | `POST /auth/otp/send` `email`. `MailerService.sendOtpEmail` sends it over SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`). | AVAILABLE. The code is always `0000` today (BG-01). |
| 4 box code input | `POST /auth/otp/verify` `otp` | AVAILABLE. The API accepts only the fixed code (BG-01). |
| Resend timer | Client timer. `ThrottlerGuard` limits the route. | Frontend only |
| Verify and continue | Verify returns the token pair | AVAILABLE |
| "Use password instead" | `POST /auth/login` | AVAILABLE |
| "Create account" | `POST /auth/register` | AVAILABLE |
| Demo access box, "local dev only" | Current demo login logic in the page | AVAILABLE. Show only when the app runs in local development. |

**Gaps**

- Frontend: `OtpInput` with paste and auto advance (M), email field with the mono LTR style (S), env check for the demo box (S). Remove the phone tab from the login page.
- Backend: BG-01 real email OTP (M). BG-42 is cancelled by decision Q14.

**Recommendation**: BUILD WITH EXISTING DATA. BG-01 must ship before any shared or production deploy. The demo box must not render in production builds.

**Notes**: Keep the code length in one constant shared by the API and the `OtpInput`. The email field and code boxes stay LTR in RTL. The email template in `MailerService` uses font weights 700 and 800. Change them to 500 to match the type rule. The language link sits on this page because the user has no settings before sign in.

---

# Shared Component Plan

All paths are under `apps/web/src`. Verdicts are against the code that ships today.

## Tokens, fonts, and helpers

| Item | Change | Verdict | Size |
|---|---|---|---|
| `app/layout.tsx` font link | Add JetBrains Mono weights 400 and 500 | EXTEND | S |
| `app/globals.css` | Add `--font-mono`, `--dash-line` (`1px dashed #b9c4bc`), `--paper` grid texture, `:lang(ar)` overrides for mono letter spacing and uppercase | EXTEND | S |
| `theme/tokens.ts` | Add `radius.card` 14, `radius.hero` 16, `radius.button` 10, `radius.chip` 8, `radius.badge` 4. Add `colors.dashLine` `#b9c4bc`, `colors.infoSurface` `#e3ebfb`. | EXTEND | S |
| `theme/typography.ts` | Add `mono` roles: `metricMono`, `overlineMono`, `badgeMono`, `tableHead`, `numeric` | EXTEND | S |
| `theme/elevation.ts` | Add `card` `0 1px 3px rgba(23,36,28,.06)` | EXTEND | S |
| `utils/money.ts` | `toCents`, `centsToAmount`, `sumCents` matching the API helper | NEW | S |
| `utils/format.ts` | `formatMoney` always prints two decimals. Add `formatRef(id)` for short references. | EXTEND | S |
| `hooks/useBrandRole.ts` | Brand role and `can(action)` helper | NEW | S |

## Primitives in `components/ui`

| Component | Change | Verdict | Size |
|---|---|---|---|
| `Card`, `PressableCard` | Radius 14, hairline border, `card` shadow, optional `header` slot with dashed divider | EXTEND | S |
| `SignatureCard` | Add `Hero` variant: dark surface, grid paper texture, radius 16 | EXTEND | S |
| `StatusBadge` | Mono, uppercase, radius 4, tones ok, pend, bad, neu, info. One map from status values to tones. | REPLACE | S |
| `Tag` (dashed outline mono tag) | New | NEW | S |
| `Button` | Radius 10, `mint` variant for dark hero, `danger-outline` variant, `sm` size, count pill | EXTEND | S |
| `FilterChip` | Radius 8, mono count | EXTEND | S |
| `AppText` | Add `mono` and `overline` mono variants | EXTEND | S |
| `TextInput` | Add mono input variant for money and phone | EXTEND | S |
| `Icon` | Add `in`, `up`, `lock`, `bank`, `star`, `pin`, `clock` if missing. Mark directional icons for RTL mirror. | EXTEND | S |
| `AsyncStates` | No change in behavior. Restyle. | EXTEND | S |
| `ModalSheet` | No change in behavior. Restyle. | EXTEND | S |
| `components/layout/AppShell.tsx` | Mono role label, mono nav counts, dashed footer rule, Notifications and Settings in the footer | EXTEND | M |

## New shared components

| Component | Used by screens | Verdict | Size |
|---|---|---|---|
| `DataTable` (mono headers, dashed rows, end aligned numbers, card list below 768px) | 8, 10, 17, 19, 3 | NEW | M |
| `LedgerTable` (DataTable plus in and out icon cell, signed amounts, running balance column) | 3, 10 | NEW | M |
| `Rows` and `ListRow` (dashed divided list) | 1, 2, 4, 18, 20, 21 | NEW | S |
| `KpiCells` (dashed cell grid) | 1, 3, 5, 10, 14 | NEW | S |
| `Equation` (a minus b equals c line) | 2, 3, 10 | NEW | S |
| `Meter` and `MiniBar` | 2, 5, 8 | NEW | S |
| `BarChart` | 1 (after BG-08) | NEW | M |
| `Pipeline` | 1 | NEW | M |
| `HStepper` (horizontal lifecycle bar) | 5, 15, 23 | NEW | M |
| `VerticalTimeline` | 11 | NEW | M |
| `SplitPane` (list and detail, one pane on small screens) | 2, 12 | NEW | M |
| `Receipt` (tear lines, line items, total) | 9 | NEW | M |
| `KeyValueList` | 9, 11, 14, 15 | NEW | S |
| `SegmentedControl` | 6, 7, 14, 22, 23 | NEW | S |
| `RadioCard` | 9 | NEW | S |
| `RangeSlider` | 7, 13 | NEW | M |
| `Checklist` | 6, 15 | NEW | S |
| `VideoPlayer` with version switch | 6 | NEW | M |
| `Dropzone` with progress | 15, 16 | NEW | M |
| `OtpInput` and `PhoneInput` | 23 | NEW | M |
| `AvatarStack` | 8, 18 | NEW | S |
| `DueChip` | 4, 15, 19 | NEW | S |
| `Kbd` and a keyboard shortcut hook | 1, 2, 8 | NEW | S |
| `GroupHeader` (overline, count, dashed rule) | 18, 20 | NEW | S |
| `Toggle` | 22 (later) | NEW | S |

---

# Consolidated Backend Gap List

Each item names the module, the size, and the screens it unblocks. "Defer" means the builder hides the UI and the item waits for a product decision.

## auth

| ID | Gap | Size | Unblocks | Note |
|---|---|---|---|---|
| BG-01 | Real email OTP through `MailerService`: random code, hashed storage, 10 minute expiry, attempt limit. Accept the fixed code only in development and test. Fail closed in production. | M | 23 | P0 security, decision Q14 |
| BG-42 | ~~Real SMS OTP provider~~ CANCELLED. Decision Q14 uses email OTP. BG-01 now holds code storage, expiry, and attempt limit. | n/a | 23 | Cancelled 2026-10-30 |

## users

| ID | Gap | Size | Unblocks | Note |
|---|---|---|---|---|
| BG-39 | `GET /users/me` and `PATCH /users/me` with `displayName` (new column) and `locale` | M | 22, 21 | Migration |
| BG-40 | Notification preferences per category and channel. `NotificationsService` reads them before push. | M | 22 | Defer |

## brands

| ID | Gap | Size | Unblocks | Note |
|---|---|---|---|---|
| BG-08 | Dashboard: 6 month series of funded and released amounts, and brand totals for funded, allocated, released, refunded, available | S | 1 | Spend name decision (Q3) |
| BG-09 | Billing summary: funded, released, allocated not released, refunded, available | S | 10 | Reconcile with invariant 1 |
| BG-10 | Billing ledger: add `hold` and `release` rows with creator name and a `type` filter | M | 10 | Brand view never shows `fee` or `payout` as separate rows (Q11) |
| BG-11 | Add `memberRole` to `GET /brands/me` | S | 1, 2, 5, 6, 9, 10, 11, 18, 21, 22 | Role aware UI |
| BG-12 | Public brand stats: briefs posted, creators hired, average approval time | M | 21 | |
| BG-13 | `POST /brands/me/members/:id/resend` for invites | S | 21 | `owner` only |

## campaigns

| ID | Gap | Size | Unblocks | Note |
|---|---|---|---|---|
| BG-04 | Align `escrow/manual-payment` roles with `escrow/checkout` (`owner`) | S | 9 | P0 role consistency |
| BG-05 | Creator reads of `GET /campaigns` and `GET /campaigns/:id` return public columns only | S | 4, 13, 14 | P0 data exposure |
| BG-14 | Fund amount up to `budgetMax` times `slots`. Default midpoint times `slots`. | M | 9 | Money rule. Spec and invariant tests. |
| BG-15 | `GET /campaigns/mine` enrichment: applied count, shortlisted count, total proposals, lowest price, hired count with initials, `fundedAt`. Add `q` search. `fundedAt` also on `GET /campaigns/:id`. | M | 1, 5, 8, 18 | |
| BG-16 | `GET /campaigns` filters: search, multi niche, `maxBudget`, duration, `needsShipping`, sort, proposal count per row | M | 13 | |
| BG-17 | Platform or format field (Reel, TikTok, Story) | M | 7, 9, 14 | Decision (Q5) |
| BG-18 | Niche values for Fitness, Tech, Kids, Lifestyle | M | 7, 13, 16 | Decision (Q4), enum migration |
| BG-19 | Budget benchmark per format, length, and language | L | 7 | Defer |
| BG-20 | Match score between creator niches and brief | M | 4, 13 | Defer. A client niche overlap can stand in. |

## proposals

| ID | Gap | Size | Unblocks | Note |
|---|---|---|---|---|
| BG-02 | Add `BrandRoleGuard` with `owner` and `approver` to `PATCH /proposals/:id/status` | S | 2 | P0 security |
| BG-21 | `GET /campaigns/:campaignId/proposals` adds `jobsDone`, `approvalRate`, `averageRevisions` per row in one grouped query, and portfolio total count | M | 2 | Reuse the `getCreatorProfilePreview` queries |
| BG-22 | Accept quote: `GET /proposals/:id/quote` with `creatorPrice`, `platformFee`, `totalAmount`, `availableAfter` | S | 2 | Uses `EscrowService.quote` |
| BG-23 | `GET /proposals/mine` selects `campaign.closesAt`, `budgetMin`, `budgetMax`, `status` | S | 20 | |
| BG-24 | `CreateProposalDto.pitch` max length 600 | S | 14 | |

## creators

| ID | Gap | Size | Unblocks | Note |
|---|---|---|---|---|
| BG-06 | Payout request DTO, balance check against available minus open requests, method enum, `GET /creators/me/payout-requests` | M | 3 | P0 security |
| BG-07 | `DELETE /creators/me/portfolio-items/:id` with owner check | S | 16 | P0 defect |
| BG-25 | `GET /creators/me/stats` with `jobsDone`, `approvalRate`, `averageRevisions` | S | 14, 16 | Share one query with BG-21 |
| BG-26 | Ledger rows add ISO `createdAt`, `type`, campaign title, and a stable reference | S | 3 | |
| BG-27 | Clearance window between release and withdrawable | L | 3 | Defer. Product decision (Q15). |
| BG-28 | Home queue tasks add `kind` and `dueAt` | S | 4 | Needs BG-30 |

## collaborations

| ID | Gap | Size | Unblocks | Note |
|---|---|---|---|---|
| BG-03 | Add `BrandRoleGuard` with `owner` and `approver` to `POST /collaborations/:id/confirm-shipment` | S | 11 | P0 security |
| BG-29 | `POST /collaborations/:id/confirm-receipt` (creator), `received_at` column, system message, new catalog event | M | 4, 11, 15 | Event goes into `notifications.ts` (decision 4) |
| BG-30 | `dueAt` from `proposal.deliveryDays` on collaboration detail and list | S | 4, 15, 19 | Q16 about the start date |
| BG-31 | Revision limit (default 2) and used count. The review rejects a revision past the limit. | M | 6, 11, 15, 19 | Q17 |
| BG-32 | Auto approve after N days with a scheduled release | L | 6, 15 | Defer. Moves money. |
| BG-33 | `approvedAt` and `paidAt` on collaboration detail from the `release` and `payout` rows | S | 11, 15 | Read only from `transactions` (decision 2) |

## deliverables

| ID | Gap | Size | Unblocks | Note |
|---|---|---|---|---|
| BG-34 | Store the optional note on `approve` as feedback | S | 6 | |
| BG-35 | Structured revision reasons | S | 6 | Optional |
| BG-36 | Media metadata: deliverable file size, portfolio clip duration | S | 2, 11, 16 | Optional |
| BG-37 | Per talking point checklist state on a deliverable | M | 6, 15 | Defer |

## notifications

| ID | Gap | Size | Unblocks | Note |
|---|---|---|---|---|
| BG-38 | `brief_matched` event for creators when a matching brief goes live | M | 17, 4 | Defer. Catalog change. |

## payments

| ID | Gap | Size | Unblocks | Note |
|---|---|---|---|---|
| BG-41 | Saved payment methods (Paymob card tokens) | L | 9, 10, 22 | Defer |

## Totals

| Size | Count | IDs |
|---|---|---|
| S | 20 | BG-02, 03, 04, 05, 07, 08, 09, 11, 13, 22, 23, 24, 25, 26, 28, 30, 33, 34, 35, 36 |
| M | 17 | BG-01, 06, 10, 12, 14, 15, 16, 17, 18, 20, 21, 29, 31, 37, 38, 39, 40 |
| L | 4 | BG-19, 27, 32, 41 |
| Total | 41 | BG-42 is cancelled (decision Q14) |

Deferred items: BG-19, 20, 27, 32, 37, 38, 40, 41. Decision items: BG-17, 18. Cancelled: BG-42.

---

# Suggested Build Order

```text
 W0 API safety ──┐
                 ├──> W2 screens on existing data ──> W3 money backend + screens ──> W4 workflow backend + reveal
 W1 tokens/ui ───┘
```

| Wave | Content | Backend items | Screens |
|---|---|---|---|
| W0 | API P0 fixes. Runs in parallel with W1. | BG-01, 02, 03, 04, 05, 06, 07, 11 | None directly. Unblocks 3, 16, 23 and role aware UI. |
| W1 | Ledger Mono token and primitive pass. Web money helper. `useBrandRole`. AppShell restyle. `DESIGN.md` Ledger Mono subsection. | None | Shell only. Every existing page picks up the new primitives. |
| W2 | Screens that need no new backend, in priority order. Each ships with the hides named in its section. | None | 23, 1, 4, 13, 14, 15, 2, 5, 6, 7, then 12, 17, 8, 11, 19, 16, then 18, 20, 21, 22 |
| W3 | Money backend, then the money screens. | BG-14, 09, 10, 08, 22, 26 | 9, 10, then reveal on 1 (chart), 2 (impact), 3 (statement fields) |
| W4 | Workflow backend, then reveal hidden parts. | BG-29, 30, 31, 33, 34, 15, 16, 21, 23, 24, 25, 28, 12, 13, 39 | Reveal on 4, 5, 6, 8, 11, 13, 14, 15, 16, 18, 19, 20, 21, 22 |
| Later | Deferred and decision items | BG-17, 18, 19, 20, 27, 32, 35, 36, 37, 38, 40, 41, 42 | As decided |

Each wave closes with the commands in "Verification Commands" and an English and Arabic screenshot pair for every screen it touched (Q2).

---

# Decisions

The user accepted every recommended answer on 2026-10-30. Each answer below is now a decision. Treat it as binding for all build phases. The user changed Q14 on 2026-10-30: login codes go by email, not SMS.

| ID | Question | Decision (accepted 2026-10-30) |
|---|---|---|
| Q1 | Does Ledger Mono apply to the web only, or to mobile too? | Web only for now. Add a web subsection to `DESIGN.md`. Keep mobile radii. |
| Q2 | Does decision 6 (English and Arabic screenshot pair) apply to web screens? | Yes. Use the same rule per web screen and per wave. |
| Q3 | What does "spend" mean on the dashboard: funded or released? | Released. Rename the current number "Funded this month" until BG-08 ships. |
| Q4 | Use the 6 API niche values, or add Fitness, Tech, Kids, Lifestyle? | Use the 6 API values in W2. Decide on BG-18 later. |
| Q5 | Is "format" a platform (Reel, TikTok, Story) or a video type (unboxing, talking head, try on)? | Keep `videoType` chips (Talking head, Try on, Unboxing) as artboard 3b and DEC-011 say. Add a platform field only if brands ask. |
| Q6 | Which status labels win: the glossary ("Open", creator "Pending") or the studio ("Live", "Applied", "Shortlisted")? | The glossary for brief status ("Open"). The studio for creator proposal status, and update the glossary. |
| Q7 | Do briefs need a human reference such as "BR-2291"? | Use a short id derived from the UUID in W2. Add a sequence column only if support needs it. |
| Q8 | What does "deliverable 2 of 3" mean? | Version number of the current deliverable. Drop "of 3" until a limit exists. |
| Q9 | The API supports `decline` on a deliverable. Keep it on the review screen? | Yes, in an overflow menu with a confirm step. |
| Q10 | The one page brief has no `slots`, `closesAt`, or `doNotSay` field. Add them? | Add `slots` and `closesAt` to the Budget section and `doNotSay` to the Video section. |
| Q11 | Which sign convention for the brand ledger: brand pocket or escrow? | Escrow view as in the studio (funded plus, released and refunded minus). Change the billing API signs in BG-10. |
| Q12 | Do creators get a chat list page? | Yes. Reuse the two pane layout at `/creator/chats`. |
| Q13 | Show creator vetting status and brand verification status on the profile screens? | Yes, as one status badge in the header. No new data needed. |
| Q14 | Which SMS provider for real OTP? | No SMS. Send the login code by email through the existing `MailerService` (SMTP). BG-01 adds random codes, expiry, and attempt limits. BG-42 is cancelled. The login page drops the phone field. |
| Q15 | Is there a clearance window between release and withdrawable? | No window in v1. Hide the "Pending" cell. |
| Q16 | When does the delivery clock start: at accept or at product received? | At product received when `needsShipping` is true, else at accept. This ties BG-30 to BG-29. |
| Q17 | Is the revision limit per brief or per platform? | Per brief, default 2, set on the brief form. |

---

# Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RISK-W-01 | The redesign ships before BG-01 and exposes a login that accepts a fixed code. | Medium | High | W0 runs first. Block any shared deploy on BG-01. |
| RISK-W-02 | A derived money number differs from the API number (escrow impact, running balance). | Medium | High | Integer cents helper. Hide numbers that need the fee rate until BG-22. Unit tests for every money derive helper. |
| RISK-W-03 | Hidden parts never come back after W2. | Medium | Medium | Each screen section lists its hides. W4 has a reveal checklist per screen. |
| RISK-W-04 | N calls per brief on screen 18 slow the page for large brands. | Low | Medium | Limit to open briefs. Replace with BG-15. |
| RISK-W-05 | Mono uppercase overlines break Arabic text. | High | Medium | `:lang(ar)` overrides in W1. Arabic screenshot pair per screen. |
| RISK-W-06 | BG-14 changes the fund rule and breaks the existing mobile fund screen. | Medium | High | Keep the old range check as a lower bound. Run the mobile fund flow in the W3 test pass. |

---

# Verification Commands

These script names exist in the package files today.

```bash
# web
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter web build

# api, for every wave with backend items
pnpm --filter api lint
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter api build

# shared types, for BG-29, BG-38, and the notification category map
pnpm --filter @ugcx/shared-types lint
pnpm --filter @ugcx/shared-types typecheck
pnpm --filter @ugcx/shared-types build
```

`pnpm --filter web test` runs only `src/__tests__/smoke.test.ts` today. Each wave must add tests for its derive helpers to that runner or extend the `test` script.

## Test impact by backend item

| Backend items | Spec files to extend |
|---|---|
| BG-01 | `modules/auth/auth.service.spec.ts` |
| BG-02, BG-21, BG-22, BG-23, BG-24 | `modules/proposals/proposals.service.spec.ts`, plus a guard test for the controller |
| BG-03, BG-29, BG-30, BG-31, BG-33 | `modules/collaborations/collaborations.service.spec.ts`, `modules/deliverables/deliverables.service.spec.ts` |
| BG-04, BG-05, BG-14, BG-15, BG-16 | `modules/campaigns/campaigns.service.spec.ts`, `modules/escrow/escrow.service.spec.ts`, `test/escrow.e2e-spec.ts` |
| BG-06, BG-07, BG-25, BG-26, BG-28 | `modules/creators/creators.service.spec.ts` |
| BG-08, BG-09, BG-10, BG-11, BG-12, BG-13 | `modules/brands/dashboard.service.spec.ts`, `modules/brands/billing.service.spec.ts`, `modules/brands/brands.service.spec.ts`, `modules/brands/brand-members.service.spec.ts` |
| BG-29, BG-38 | `modules/notifications/notifications.service.spec.ts` |
