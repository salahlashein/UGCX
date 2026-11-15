# High-Level Architecture & Current Scope
See HLD.md for the overarching architecture and roadmap.

The current active project phases are **Brand Flow Integration & Creator Sync** (`apps/mobile` + `apps/api`) and **Web Application Soft Launch** (`apps/web`). The plans are sets of documents:

### Brand Flow Integration & Creator Sync (`operations/specs/brand_flow_integration/`)
- `operations/specs/brand_flow_integration/00_overview.md` — current-state audit, phase map, cross-cutting decisions, status glossary, ledger invariants, verification commands. Read this first.
- `plan_phase_1.md` — brand identity, team roles, brief authoring. Artboards 3a, 4a, 3b, 4c, 4g, 4h.
- `plan_phase_2.md` — campaign escrow, funding, allocation, refund, billing. Artboards 3c, 3d, 4d, 4e, 4f, 4h.
- `plan_phase_3.md` — deliverable review loop, dashboard, chats. Artboards 3e, 3f, 3g, 3h.
- `plan_phase_4.md` — notification event backbone, failure UX, Arabic completion. Artboard 4b and creator screen 15.

### Web Application Soft Launch (`operations/specs/web_app_soft_launch/`)
- `operations/specs/web_app_soft_launch/00_overview.md` — web architecture, phase map, cross-cutting decisions, complete route map, verification commands.
- `operations/specs/web_app_soft_launch/plan_phase_1.md` — Next.js 15 workspace scaffold (`apps/web`), C3 Sage UI primitives, bilingual EN/AR RTL, Axios JWT refresh, responsive `AppShell`, and Auth/Onboarding.
- `operations/specs/web_app_soft_launch/plan_phase_2.md` — Brand web flows: dashboard, 1-page post brief, campaign escrow checkout, proposals inbox & accept, shipment, video review player, chats, billing ledger, brand profile.
- `operations/specs/web_app_soft_launch/plan_phase_3.md` — Creator web flows: home queue, campaign discovery, submit proposal, work board, deliverable video upload, earnings & payout request, creator profile, shared chat/notifications/settings, and E2E verification.

### Web Application Architecture Modernization (`operations/specs/web_app_architecture_refactor/`)
- `00_overview.md` — Architecture modernization roadmap, cross-cutting decisions, exit criteria.
- `plan_phase_1.md` — Localization single folder consolidation (`src/i18n/en.json`, `ar.json`, `index.tsx`, `types.ts`).
- `plan_phase_2.md` — Common usage deduplication (`queryAggregator`, `dashboardMetrics`, `useKeyboardShortcut`).
- `plan_phase_3.md` — Hook separation, domain isolation (`useBrandDashboardData`, `useCreatorHomeData`) and Query Key Factory (`queryKeys.ts`).
- `plan_phase_4.md` — Monolithic page decomposition into feature slices (`src/features/brand/*`, `src/features/creator/*`).
- `plan_phase_5.md` — Next.js 15 App Router hardening (`middleware.ts` Edge route protection, `loading.tsx` skeletons, `error.tsx` boundaries).

Every task in those files carries a NEW, EXTEND, or REPLACE verdict against the code that already ships. Check the verdict before you write a line.

## Decisions a future agent must not rediscover

1. Escrow funds at the **campaign**, not at the collaboration. A proposal accept allocates from the campaign balance and raises no second charge.
2. `transactions` is the **only** ledger. Campaign rows carry `campaign_id`. Collaboration rows carry `collaboration_id`. There is no parallel escrow table.
3. Brand team roles (`owner`, `approver`, `viewer`) live in `brand_members` and are enforced by `BrandRoleGuard`. They are **not** in the JWT. `RolesGuard` still owns the coarse `brand`, `creator`, `admin` check.
4. The notification event catalog lives in `packages/shared-types/src/notifications.ts`. One event, two copy strings, two recipients. Never add a second catalog.
5. Money is `numeric(10,2)` strings in the database and integer cents in arithmetic, through `apps/api/src/common/utils/money.ts`. Never use `parseFloat` on an amount.
6. Every new mobile screen ships an English and an Arabic screenshot pair before its phase closes.
7. High-risk features (Product Catalog, 5-Step Campaign Wizard, Brand Team Management, Automated Payouts, APNs Push) are gated behind feature flags in `packages/shared-types/src/feature-flags.ts` and `apps/mobile/src/config/features.ts`. Do not re-enable without explicit user request.

# Design reference & UI System (Brand C3 Sage)
See `DESIGN.md` for design conventions. Read it before any design or UI work.

The **Brand C3 Sage** design system is the single source of truth for all mobile UI across both Brand and Creator views:
- **Theme tokens:** Always import colors, spacing, radius, and sizes from `apps/mobile/src/theme/tokens.ts`, typography from `apps/mobile/src/theme/typography.ts`, fonts from `apps/mobile/src/theme/fonts.ts`, and shadows from `apps/mobile/src/theme/elevation.ts`. Never hardcode hex colors, font sizes, or raw shadows.
- **Core surfaces:** Page backgrounds use `colors.canvas` (`#eff2ed`). Content sits inside white elevated `<Card>` or `<PressableCard>` containers (`colors.surface` `#ffffff`, `radius.xl` 18px, `elevation.soft`), with `colors.primary` (`#2f5d46`) for primary actions and `colors.accentSoft` (`#e1ebe4`) for icon tiles.
- **Reusable primitives:** Always build screens from `apps/mobile/src/components/ui/` (`AppText`, `Card`, `PressableCard`, `SignatureCard`, `Button`, `TextInput`, `FilterChip`, `StatusBadge`, `Icon`, `LoadingState`, `ErrorState`, `EmptyState`, `QueryStateView`, `AppBottomSheet`) and `apps/mobile/src/navigation/FloatingTabBar.tsx`.
- **Reference screens:** Use `BrandDashboardScreen.tsx`, `BrandProfileScreen.tsx`, `MyBriefsScreen.tsx`, and `BrandBillingScreen.tsx` in `apps/mobile/src/screens/brand/` as the canonical layout templates for dashboards, profiles, lists, and ledgers.


# Instructions
- always be clear, concise, and empathetic in communication
- avoid making assumptions about the user's intent or knowledge
- less is more, your output should be minimal and to the point enough detail without unnecessary verbosity. 
- for every user request/task, ask the right questions and explore all possibilities
- when you finish the task, always verify your own work according to clear KPIs and quality standards. Verify from the user.
- if you are unsure about the user's intent, ask clarifying questions to ensure you understand their needs.




# How to generate words: use ste-writing
Write prose in ASD-STE100 Simplified Technical English. This applies to documentation, READMEs, pull-request text, error messages, release notes, and comments. It does not apply to code, identifiers, or command syntax.


## Rules


*WORDS*
- Use one name for one thing. Do not call the same item by two different names.
- Use the short common word: start (not begin/commence/initiate), use (not utilize/leverage), help (not facilitate), make sure (not ensure), before (not prior to), after (not subsequent to), about (not regarding/concerning), get (not obtain/acquire), show (not demonstrate), also (not additionally/furthermore/moreover).
- Give each word one meaning. "fall" means to move down, not to decrease.
- No marketing adjectives: seamless, robust, powerful, cutting-edge, effortless, world-class, next-generation, revolutionary.
- American spelling.


*VERBS*
- Active voice. "the parser reads the file", not "the file is read by the parser".
- Use a verb for an action. "analyze the log", not "perform an analysis of the log".
- No stacked auxiliaries. Not "it is important to note that this may help to improve". Write "this improves X".
- No "-ing" main verb where a simple tense works.


*SENTENCES*
- One instruction per sentence. Max 20 words (instruction), max 25 (descriptive).
- No contractions. Use articles: a, an, the, this, these.


*PUNCTUATION*
- No semicolons. Write two sentences.
- NO em dashes. 


*STRUCTURE*
- One topic per paragraph, max six sentences. For steps, use a numbered vertical list, one action per item, imperative form. Put a condition before its command.


Write only the requested text. No preamble, no summary, no closing remarks.


## Modes


- **strict** — procedures, runbooks, safety text, error messages: apply every rule and both length caps.
- **STE-flavored** — general prose (communication with the user, READMEs, PR descriptions, docs): apply the sentence, paragraph, active-voice, and no-phrasal-verb discipline; relax the ~900-word dictionary lockdown so the text keeps enough range to read naturally.


## Self-lint (run before returning text)


1. Any sentence over 20 words? Split it.
2. Any semicolon? Replace with a period. em dashes? remove.
3. Any contraction? Expand it.
4. Any passive voice with a known actor? Make it active.
5. Any "-ing" main verb, nominalization ("perform an analysis"), or phrasal verb ("spin up")? Replace with a plain verb.
6. Same thing named two ways? Pick one name.


<!-- Free official standard (do not paste it in full; it is copyrighted): https://asd-ste100.org -->


## The Iron Law


No completion claims without fresh verification evidence.


For every claim such as "done", "fixed", "passes", "ready for PR", or "deployable":


1. Identify the command that proves the claim.
2. Run the full command in the current session.
3. Read the output completely enough to verify the result.
4. Count failures, warnings, or threshold misses.
5. State the claim only if the output supports it.
6. If the output does not support it, report the actual state and next remediation step.


NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE


If you haven't run the verification command in this message, you cannot claim it passes.


# Rules


## Must Always
- Match a tone balancing clarity with conciseness. Be brief and to the point.
- Validate inputs and keep security checks intact.
- Follow established repository patterns before inventing new ones.
- **Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means that you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.
- Validate outputs before claiming success. You cannot say the step is done without verifying that it actually worked by evidence.


## Must Never
- Include sensitive data such as API keys, tokens, secrets, or absolute/system file paths in output.
- Submit untested changes.
- Bypass security checks or validation hooks.
