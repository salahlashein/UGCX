# Document Control

- **Version**: 1.2
- **Date Created**: 2026-09-02
- **Last Updated**: 2026-09-03
- **Status**: **Waves 0 and 1 delivered.** Blocked at the TASK-P1-059 design review hard stop. Waves 2 to 6 pending that accept.
- **v1.2 changes**: corrected the TASK-P1-016 press-scale typo (0.98 -> 0.97), specified the `soft`/`strong` card tones that were undefined, added the Wave 0/1 delivery record below.

## Delivery record

| Wave | Status | Verified |
|---|---|---|
| 0 — token and font foundation | Delivered 2026-09-02 | typecheck 0 errors, lint 0 errors, tests 8 suites / 23 passed |
| 1 — shared primitives + LoginScreen | Delivered 2026-09-03 | typecheck 0 errors, lint 0 errors, tests 11 suites / 59 passed |
| 2 to 6 | Not started | Gated on TASK-P1-059 |

Wave 1 added one file outside the plan's directory map: `apps/mobile/__mocks__/react-native-reanimated.js`. Reanimated 4 has no working Jest mock in this environment, and its own `/mock` entry still imports the real native module. Without this file every `LoginScreen` suite fails at import. **Consequence: the test suite proves the animated primitives render, it proves nothing about their motion.** Press feel and the success spring stay unverified until a release-build device check.
- **Scope prefix**: `design`
- **Supersedes**: the "do not apply DESIGN.md" decision recorded in the header comment of `apps/mobile/src/theme/tokens.ts` (TASK-P1-014 / DES-P1-005 of `operations/specs/feature_mobile_app_phase1/plan.md`)

---

# Executive Summary

- **Goal**: Port the color, typography, radius, spacing, elevation and component language documented in `DESIGN.md` into `apps/mobile`, translated to native React Native idioms and made fully RTL-correct for Arabic.
- **Scope**: production feature (UI/design-system refactor, mobile only)
- **Domains**: frontend (mobile). `apps/api` is not touched by any task in this plan.
- **Architecture**: One expanded token module (`src/theme/`) feeds a small set of shared primitives (`AppText`, `Screen`, `Icon`, `Button`, `Card`, `TextInput`, `ChipSelect`, `StatusBadge`, `BottomActionBar`, state views). Screens consume only those primitives and never re-declare colors, font families, or physical-direction styles. Direction correctness is enforced by an ESLint rule, not by review discipline.
- **Tech Stack**: Expo SDK 57, React Native 0.86 (new architecture on), TypeScript, React Navigation v7 (native-stack + bottom-tabs), `expo-font` + `@expo-google-fonts/inter` + `@expo-google-fonts/ibm-plex-sans-arabic`, `@expo/vector-icons`, `react-native-reanimated` 4 + `react-native-worklets`, `expo-haptics`, `react-i18next` + `I18nManager`.
- **Entry Condition**: `operations/specs/feature_mobile_app_phase1/plan.md` is delivered. All 18 screens render and `pnpm --filter mobile typecheck && lint && test` is green on `master`.
- **Exit Condition**: Every screen and navigation surface in `apps/mobile` renders with `DESIGN.md` tokens; no screen file contains a raw hex value, a raw font size, or a physical-direction style property; the app renders correctly in `en` (LTR) and `ar` (RTL) on iOS and Android; typecheck, lint and tests are green; a screenshot pair (en + ar) exists for every screen.

---

# Requirements

## Functional Requirements

- **REQ-001**: THE SYSTEM SHALL express every color, radius, spacing value, font size, line height and letter spacing used in `apps/mobile` as a named export of `src/theme/`, sourced from `DESIGN.md` where `DESIGN.md` defines the value.
- **REQ-002**: WHERE `DESIGN.md` does not define a value that a native mobile app requires (elevation, danger, disabled input, tab bar, chip, badge, skeleton), THE SYSTEM SHALL define it in `src/theme/` and mark it in code as invented, with a one-line rationale.
- **REQ-003**: THE SYSTEM SHALL render Latin text in Inter and Arabic text in IBM Plex Sans Arabic, selecting the family from the active locale, at weights 400 and 500 only.
- **REQ-004**: WHEN the active locale is `ar` THE SYSTEM SHALL mirror every layout, align every text run to the reading direction, and horizontally flip every directional icon.
- **REQ-005**: IF a style declaration uses `marginLeft`, `marginRight`, `paddingLeft`, `paddingRight`, `left`, `right`, `borderLeft*`, `borderRight*`, or `textAlign: 'left' | 'right'` THEN THE SYSTEM SHALL fail `pnpm --filter mobile lint`.
- **REQ-006**: THE SYSTEM SHALL give every interactive element a hit area of at least 44 x 44 pt.
- **REQ-007**: WHEN a user presses a `Button`, `Card` acting as a link, or a `ChipSelect` option THE SYSTEM SHALL apply a `scale(0.97)` transform within 150 ms of press-in, not of press-out.
- **REQ-008**: THE SYSTEM SHALL NOT animate a bottom-tab switch or override a native stack transition.
- **REQ-009**: WHEN `useReducedMotion()` returns true THE SYSTEM SHALL reduce every entrance and success animation to an opacity change and SHALL keep press feedback unchanged.
- **REQ-010**: THE SYSTEM SHALL show status values (campaign, proposal, collaboration, deliverable) through a `StatusBadge` with a tone mapping, not as plain muted text.
- **REQ-011**: WHEN a terminal-positive event completes (escrow funded, deliverable uploaded, proposal submitted, payout details saved) THE SYSTEM SHALL present it on a `signature-forest` surface with white type.
- **SEC-001**: THE SYSTEM SHALL NOT change any screen's data flow, permission check, error parsing, or `SEC-002` payout-visibility behavior while restyling it.
- **CON-001**: THE SYSTEM SHALL keep every user-facing string in `src/i18n/{en,ar}.json`. New strings introduced by this plan (empty-state headlines, status labels, accessibility labels) SHALL ship in both languages in the same commit.
- **CON-002**: THE SYSTEM SHALL NOT introduce a dark theme in this plan. `app.json` keeps `userInterfaceStyle: "light"`.
- **GUD-001**: Text on a light surface SHALL meet WCAG AA (4.5:1 for body, 3:1 for >= 18.66px/500 or >= 24px). Non-text UI boundaries that convey state (input borders, focus rings) SHALL meet 3:1.
- **PAT-001**: Screens SHALL compose primitives. A screen file SHALL NOT contain a hex literal, a `fontFamily`, a numeric `fontSize`, or a `shadow*`/`elevation` declaration.

```gherkin
Feature: RTL correctness of the ported design system
  Scenario: A ported screen mirrors in Arabic
    Given the stored locale is "ar"
    And the app has reloaded so I18nManager.isRTL is true
    When any ported screen renders
    Then rows read right-to-left
    And text aligns to the right
    And back chevrons, send icons and list chevrons point right
    And prices render with Latin digits inside a right-aligned Arabic sentence

Feature: Token discipline
  Scenario: A screen cannot reintroduce a raw style value
    Given a developer adds "color: '#ff0000'" to a screen file
    When "pnpm --filter mobile lint" runs
    Then the lint run fails with a restricted-syntax error

Feature: Signature surface scarcity
  Scenario: Escrow funding is a voltage moment
    Given a brand completed Paymob checkout
    And the collaboration status becomes "funded"
    When the AcceptProposal screen renders the success state
    Then the confirmation sits on a signature-forest card with white type
    And a success haptic fires once
    And the card scales from 0.96 to 1 with a spring

Feature: Motion gating
  Scenario: Tab switching stays instant
    Given the brand tab navigator is visible
    When the user taps the Products tab
    Then the screen swaps with no slide, fade, or cross-dissolve

  Scenario: Reduced motion is respected
    Given the OS reduce-motion setting is on
    When a success state renders
    Then the card appears with an opacity change only and no scale spring
```

---

# Dependencies

| ID | Name | Type | Version | Purpose |
|----|------|------|---------|---------|
| DEP-001 | `expo-font` | package | resolved by `npx expo install` | Load and register the two font families. Already present transitively; make it a direct dependency. |
| DEP-002 | `@expo-google-fonts/inter` | package | latest | Latin type. Static weights `Inter_400Regular`, `Inter_500Medium`. |
| DEP-003 | `@expo-google-fonts/ibm-plex-sans-arabic` | package | 0.4.x | Arabic type. Static weights `IBMPlexSansArabic_400Regular`, `IBMPlexSansArabic_500Medium`. OFL. |
| DEP-004 | `@expo/vector-icons` | package | resolved by `npx expo install` | Icon set (Feather + Ionicons). Currently **not resolvable** in `apps/mobile` — must be installed explicitly. |
| DEP-005 | `react-native-reanimated` | package | 4.x | Press feedback, entrances, success springs. Required by the `animate-expo` skill; core `Animated` is not acceptable. |
| DEP-006 | `react-native-worklets` | package | matching Reanimated 4 | Reanimated 4 runtime peer. |
| DEP-007 | `expo-haptics` | package | resolved by `npx expo install` | Success haptic on the four terminal-positive states only. |
| DEP-008 | `react-native-gesture-handler` | package | ~2.32.0 (already installed) | Already wired at the root of `App.tsx`. No change. |

Install every one with `npx expo install <pkg>` from `apps/mobile`, never `pnpm add`, so the SDK-57-compatible version is chosen.

**No Babel change is required.** `babel-preset-expo` in SDK 54+ adds `react-native-worklets/plugin` automatically when `react-native-worklets` is installed. This repo has no `babel.config.js` and does not need one.

---

# Plan Details

## Design — *How it should happen*

### Impact on system design

```
                        BEFORE                                     AFTER
  ┌──────────────────────────────────┐        ┌──────────────────────────────────────────┐
  │ 18 screens                        │        │ 18 screens                                │
  │  · own StyleSheet.create          │        │  · compose primitives only                │
  │  · raw fontSize / color refs      │        │  · zero hex, zero fontSize, zero shadow   │
  │  · SafeAreaView repeated 18x      │        │  · <Screen> wrapper                       │
  └──────────────┬───────────────────┘        └────────────────────┬─────────────────────┘
                 │                                                  │
  ┌──────────────▼───────────────────┐        ┌────────────────────▼─────────────────────┐
  │ 9 components (ui/ + forms/)       │        │ 16 primitives                             │
  │  Button Card TextInput ChipSelect │        │  + AppText Screen Icon StatusBadge        │
  │  FormTextInput Empty Error        │        │    BottomActionBar SectionHeader          │
  │  Loading QueryStateView           │        │    ListSkeleton                           │
  └──────────────┬───────────────────┘        └────────────────────┬─────────────────────┘
                 │                                                  │
  ┌──────────────▼───────────────────┐        ┌────────────────────▼─────────────────────┐
  │ theme/tokens.ts                   │        │ theme/                                    │
  │  13 colors, 4 radii, 7 spacings   │        │   tokens.ts    colors radius spacing size  │
  │  5 type roles, no fonts           │        │   typography.ts type scale + weight roles  │
  │  "DESIGN.md intentionally         │        │   fonts.ts     family resolution per locale│
  │   not applied"                    │        │   elevation.ts iOS shadow + Android elev   │
  └──────────────────────────────────┘        │   index.ts     single import surface        │
                                               └────────────────────┬─────────────────────┘
                                                                    │
                                               ┌────────────────────▼─────────────────────┐
                                               │ DESIGN.md (unchanged source of truth)      │
                                               │  + Mobile & RTL Addendum (TASK-P1-002)     │
                                               └───────────────────────────────────────────┘
```

Nothing above the primitive layer changes: navigation graph, TanStack Query hooks, Zustand auth store, i18n init, upload service and Ably client are untouched.

### Decisions

| ID | Decision | Rationale | Alternatives Considered | Side effect (which modules?) |
|----|----------|-----------|------------------------|-------------------|
| DES-P1-001 | Replace the tokens.ts header comment. Record that the user explicitly overrode the "do not apply DESIGN.md" decision on 2026-09-02, that the port is deliberate, and that the two blockers named in the old comment (no mobile specs, no RTL guidance) are resolved by this plan, not ignored. | The old comment is now false and would mislead the next agent into reverting the port. The override needs a durable, in-code trace. | Delete the comment silently. Rejected: loses the decision history and the reason the port is safe now. | `src/theme/tokens.ts` |
| DES-P1-002 | Use Inter (Latin) + IBM Plex Sans Arabic (Arabic), static weights 400/500. Drop `DESIGN.md`'s pricing sub-system (Inter Display 475/575, `rounded.pill` CTA) entirely. | Haas is Airtable's licensed font and cannot ship. `DESIGN.md` itself names Inter Display as the substitute. Inter Display is not on Google Fonts, and React Native cannot select a 475 variable axis (no `font-variation-settings` support), so 475/575 are unreachable. There is no pricing page in this app, so the sub-system has no host. | Bundle Inter Display from rsms.me as a raw variable `.ttf`. Rejected: RN would still render it at a single default axis position. | `src/theme/fonts.ts`, `src/theme/typography.ts`, `src/components/ui/Text.tsx` |
| DES-P1-003 | Add IBM Plex Sans Arabic as a first-class family. Arabic line height = Latin line height x 1.15. | Inter has no Arabic coverage; without this, Arabic falls back to the platform default and the design system stops existing in the primary language. Arabic glyphs need more leading than `DESIGN.md`'s 1.25 body ratio allows. | Use only the platform Arabic default. Rejected: unbranded and inconsistent across iOS/Android. | `src/theme/fonts.ts`, `src/components/ui/Text.tsx` |
| DES-P1-004 | Inject `fontFamily` through a single `AppText` primitive, and replace `import { Text } from 'react-native'` with it in all 18 screens and 8 components. Do **not** put `fontFamily` in the typography tokens. | `StyleSheet.create` runs at module import, before `initI18n()` resolves the locale, so a family baked into a token would be wrong on the first render in Arabic. `AppText` resolves at render time and also gives one place for `maxFontSizeMultiplier` and `writingDirection`. | Patch `Text.defaultProps` at app start. Rejected: unsupported in RN 0.86 / React 19 and invisible to type checking. | every screen and component that renders text |
| DES-P1-005 | Map `DESIGN.md`'s desktop type scale down one step for mobile: 40 -> 32, 32 -> 28, 24 -> 22, 18 -> 17, 14 body -> 15 body. Raise body line height from `DESIGN.md`'s 1.25 to 1.45. | A 40px h1 on a 390pt-wide phone leaves room for three words. 14/1.25 is a desktop reading measure and is cramped at phone reading distance, badly so in Arabic. | Keep the web scale verbatim. Rejected: unreadable and forces two-line headings everywhere. | `src/theme/typography.ts` |
| DES-P1-006 | Map `spacing.section` (96) to 48 on mobile for band separation. Keep 96 only for vertical centering in the auth hero. | 96pt of vertical rhythm consumes 29% of a 667pt viewport. The 4px base scale and every other token carries over unchanged. | Keep 96 everywhere. Rejected: one band per screen. | `src/theme/tokens.ts`, auth screens |
| DES-P1-007 | Invent `colors.inputBorder = '#8a8f99'` for form-control outlines. Keep `hairline #dddddd` for decorative dividers and card outlines only. | `hairline` on canvas is 1.36:1 and `border-strong #9297a0` is 2.93:1. Both fail WCAG 1.4.11's 3:1 requirement for non-text UI that conveys state. `#8a8f99` is 3.25:1 and is one step darker on the same neutral ramp. | Use `hairline` as `DESIGN.md` specifies. Rejected: fails GUD-001. | `src/theme/tokens.ts`, `TextInput`, `ChipSelect` |
| DES-P1-008 | Invent `colors.danger #b3261e` / `dangerSurface #fdecea` (carried over from the current tokens). Never use `signature-coral` for errors. | `DESIGN.md` documents no error color. Coral `#aa2d00` is a brand *surface*, and reusing it for validation errors would conflate brand voltage with failure. `#b3261e` is 6.53:1 on canvas. | Derive a red from coral. Rejected as above. | `src/theme/tokens.ts` |
| DES-P1-009 | Disabled buttons use `surfaceStrong` background + `borderStrong` label, not `opacity: 0.5`. | `opacity: 0.5` on the near-black primary button drops white-on-ink from 16.7:1 to roughly 3.5:1 and fails AA. `DESIGN.md` already specifies a `border-strong` outline for disabled secondary buttons; this extends the same idea to primary. | Keep `opacity: 0.5`. Rejected: fails GUD-001. | `src/components/ui/Button.tsx` |
| DES-P1-010 | `rounded.pill` / `radius.full` is permitted for chips, filters and status badges, forbidden for buttons. | `DESIGN.md`'s "no pill outside pricing" rule governs CTA buttons on a marketing site. Chips and badges have no `DESIGN.md` equivalent and are pill-shaped by every mobile platform convention. Buttons keep `radius.lg` (12) so the signature button shape survives. | Ban pill entirely. Rejected: square chips read as broken on mobile. | `ChipSelect`, `StatusBadge` |
| DES-P1-011 | Exactly one signature surface (coral, forest, cream, or dark) per screen. | `DESIGN.md`'s "never two consecutive same-surface bands" is a long-scroll editorial rule. On a phone, one screen is one band, so the rule becomes a per-screen budget. This also preserves the "one primary action per viewport" scarcity principle. | Allow free use. Rejected: turns every screen into a color-block collage. | screen wave tasks |
| DES-P1-012 | Enforce direction-safe styles with ESLint `no-restricted-syntax` rather than review. | Direction bugs are invisible in English and 100% of the team writes English first. A lint rule catches them at authoring time on all 26 files at once. | Code review + a grep script. Rejected: not enforced in CI by default and easy to skip. | `apps/mobile/.eslintrc.js` |
| DES-P1-013 | Defer dark mode. Keep `userInterfaceStyle: "light"`. | `DESIGN.md` is light-only and defines no dark pairing for any of its eight signature surfaces. Inventing a full dark palette is a bigger design task than this port and would ship untested. | Ship a naive inverted palette. Rejected: coral and forest at white type do not invert meaningfully. | `app.json` (no change), tracked as debt |
| DES-P1-014 | Keep the existing React Navigation stack. Do not migrate to `expo-router` for `NativeTabs` / `Link.Preview`. | The `animate-expo` skill's native-tab and native-menu recommendations assume `expo-router`. Migrating router libraries mid-design-port doubles the blast radius for a purely cosmetic gain. The React Navigation bottom tab bar already defaults to no switch animation, which is the behavior that mattered. | Migrate to expo-router. Rejected: out of scope, high risk. | `src/navigation/*` |
| DES-P1-015 | Force Latin digits in Arabic for money and counts (`ar-EG-u-nu-latn`). | Egyptian bank apps, Paymob checkout, and phone keypads all show Western Arabic numerals. Rendering Arabic-Indic digits in the app and Latin digits at checkout makes a price look like a different price. | Use locale-default digits. Rejected: breaks price recognition across the escrow flow. | `src/utils/format.ts` (new) |

### Constraints & Assumptions

| Type | ID | Description | Impact if Wrong | Handling Strategy |
|------|----|-------------|-----------------|-------------------|
| Constraint | CON-P1-001 | `apps/api` must not be modified. | Scope creep, unrelated review surface. | No task in this plan lists an `apps/api` file. |
| Constraint | CON-P1-002 | Locale direction changes already require an app reload (`I18nManager.forceRTL`, handled in `src/i18n/index.ts`). | None; this is existing, correct behavior. | Font family and Arabic line-height multipliers may therefore be resolved once per app launch. |
| Constraint | CON-P1-003 | The app also builds for web (`react-native-web`, `dist/` exists). | An RN-only API breaks the web export. | Only `I18nManager.isRTL` reads and `Platform.OS` guards are used. `I18nManager.forceRTL` is already a layout no-op on web; note it, do not fix it here. |
| Constraint | CON-P1-004 | Reanimated 4 requires the new architecture. | Build failure. | `app.json` already has `newArchEnabled: true`. Verify with `npx expo config` before Wave 0 ends. |
| Assumption | ASM-P1-001 | The 4 existing test files (`LoginScreen*.test.tsx`, `RoleSelectScreen.test.tsx`, `CampaignWizardScreen.validation.test.ts`, `i18n/index.test.ts`) query by translated text and role, not by style. | Wave 1 breaks tests. | Run `pnpm --filter mobile test` at the end of every wave. Fix queries, never assertions. |
| Assumption | ASM-P1-002 | `@expo-google-fonts/ibm-plex-sans-arabic` covers the Arabic glyph set used by `src/i18n/ar.json`. | Missing glyphs render as boxes. | Wave 0 verification includes rendering every `ar.json` value once in a scratch screen and visually confirming no tofu. |
| Assumption | ASM-P1-003 | The user accepts Airtable's literal hex values (coral `#aa2d00`, forest `#0a2e0e`, cream `#f5e9d4`) for this pass. | The app ships visually derivative of Airtable. | Stated as RISK-004 with a scheduled hue-shift follow-up; the token names are semantic so a later hue change is a one-file edit. |

### Edge cases

| ID | Scenario | Expected Behavior | Handling Strategy |
|----|----------|-------------------|-------------------|
| EDGE-P1-001 | Fonts have not finished loading on first paint. | No flash of a differently-metric fallback and no blank screen. | `useFonts()` in `App.tsx`, gated with the existing `i18nReady` gate. Render the existing `LoadingState` until both resolve. `LoadingState` itself must not depend on `AppText`. |
| EDGE-P1-002 | A font file fails to load (offline first run on a dev build, or a corrupt asset). | The app still renders in the platform default family. | `AppText` falls back to `undefined` `fontFamily` when `fontsLoaded` is false; `fontWeight` is always set as a second channel. Log once via `services/logger`. |
| EDGE-P1-003 | The user has OS font scaling at 200%. | Layout does not clip; buttons keep a 44pt hit area. | `AppText` sets `maxFontSizeMultiplier: 1.6`. Buttons use `minHeight`, never fixed `height`. Every button label allows 2 lines. |
| EDGE-P1-004 | An Arabic sentence contains an embedded Latin price ("١٢٠٠ EGP"). | The number stays a single unbroken LTR run inside the RTL sentence. | Format money through `formatMoney()` and render it in its own `AppText` with `writingDirection: 'auto'`, never string-concatenated into a translated sentence. |
| EDGE-P1-005 | `ChipSelect` has more options than fit one row in Arabic (Arabic labels are typically wider). | Chips wrap to a second row, mirrored, with no horizontal overflow. | Keep `flexWrap: 'wrap'` + `gap`. Do not switch to a horizontal ScrollView; RTL scroll offset behavior differs between iOS and Android and is not worth the risk here. |
| EDGE-P1-006 | Reduced motion is on and a success state renders. | The forest card fades in. No spring, no scale, no haptic-coupled bounce. | A single `useReducedMotion()` read inside `SuccessPanel`; the haptic still fires (haptics are feedback, not motion). |
| EDGE-P1-007 | A status value arrives that the `StatusBadge` tone map does not know. | Neutral tone (`surfaceStrong` background, `body` text) and the raw key as the label. Never a crash, never an empty badge. | Default branch in `statusTone()`; unit test asserts the default. |
| EDGE-P1-008 | A screen is restyled and its `accessibilityRole="alert"` / `accessibilityState` wiring is dropped by accident. | Screen reader regression. | Every wave's task list explicitly says "preserve all existing `accessibility*` props"; the Wave 1 checklist greps for `accessibilityRole` count before and after. |
| EDGE-P1-009 | The `AcceptProposal` WebView screen renders Paymob's own page. | Paymob's checkout is not restyled and must not be. | Only the four wrapper states (loading, waiting, funded, failed/timeout) are restyled. The `<WebView>` branch keeps `flex: 1` and no chrome. |

### Directory Map

```text
apps/mobile/
├── app.json                              # unchanged (userInterfaceStyle stays "light")
├── .eslintrc.js                          # MODIFY: add no-restricted-syntax direction rules
├── package.json                          # MODIFY: DEP-001..DEP-007
└── src/
    ├── App.tsx                           # MODIFY: useFonts gate, StatusBar style="dark"
    ├── theme/
    │   ├── tokens.ts                     # REWRITE: colors, spacing, radius, sizes
    │   ├── typography.ts                 # NEW: type scale roles (no fontFamily)
    │   ├── fonts.ts                      # NEW: family map, useAppFonts(), family resolver
    │   ├── elevation.ts                  # NEW: iOS shadow + Android elevation pairs
    │   └── index.ts                      # NEW: single import surface, re-exports all four
    ├── utils/
    │   └── format.ts                     # NEW: formatMoney, formatCount (DES-P1-015)
    ├── components/
    │   ├── ui/
    │   │   ├── Text.tsx                  # NEW: AppText
    │   │   ├── Screen.tsx                # NEW: SafeAreaView + canvas + gutters + scroll
    │   │   ├── Icon.tsx                  # NEW: vector-icon wrapper, RTL flip for directional
    │   │   ├── Button.tsx                # MODIFY
    │   │   ├── Card.tsx                  # MODIFY: tone prop, PressableCard
    │   │   ├── TextInput.tsx             # MODIFY
    │   │   ├── StatusBadge.tsx           # NEW
    │   │   ├── SectionHeader.tsx         # NEW
    │   │   ├── BottomActionBar.tsx       # NEW
    │   │   ├── SuccessPanel.tsx          # NEW: the forest voltage moment
    │   │   ├── ListSkeleton.tsx          # NEW (Wave 4, optional)
    │   │   ├── EmptyState.tsx            # MODIFY: cream callout
    │   │   ├── ErrorState.tsx            # MODIFY
    │   │   ├── LoadingState.tsx          # MODIFY (must not depend on AppText, EDGE-P1-001)
    │   │   └── QueryStateView.tsx        # MODIFY: optional skeleton prop
    │   ├── forms/
    │   │   ├── ChipSelect.tsx            # MODIFY
    │   │   └── FormTextInput.tsx         # MODIFY: hint prop passthrough
    │   └── ErrorBoundary.tsx             # MODIFY: use Screen + AppText
    ├── navigation/
    │   ├── screenOptions.ts              # NEW: shared header + tab bar options
    │   ├── AuthStack.tsx                 # MODIFY
    │   ├── BrandTabNavigator.tsx         # MODIFY: icons, styled tab bar
    │   ├── CreatorTabNavigator.tsx       # MODIFY: icons, styled tab bar
    │   └── RootNavigator.tsx             # MODIFY: NavigationContainer theme
    ├── i18n/{en,ar}.json                 # MODIFY: new keys per wave
    └── screens/**                        # MODIFY: 18 files across waves 2, 4, 5, 6
```

### Directory Specifications

#### Wave 0 — Token and font foundation

| ID | Task | File(s) | Responsibility / Expected Behavior | Validations / Error handling | Key Configurations |
|----|------|---------|-------------------------------------|------------------------------|--------------------|
| TASK-P1-001 | Install dependencies | `apps/mobile/package.json` | Add DEP-001..DEP-007 via `npx expo install`. | Run `npx expo-doctor`; zero version-mismatch warnings. | No `babel.config.js` is created. |
| TASK-P1-002 | Append a "Mobile & RTL Addendum" section to `DESIGN.md` | `DESIGN.md` | Document, in `DESIGN.md`'s own voice: the Inter + IBM Plex Sans Arabic substitution, the mobile type scale, the mobile spacing mapping, `inputBorder`, `danger`, the elevation pair, the chip/badge/tab-bar specs, and the RTL rules. Do not edit any existing section. | The addendum references only tokens that exist in `src/theme/`. | New H2 at the end, before "Known Gaps". |
| TASK-P1-003 | Rewrite `tokens.ts` | `src/theme/tokens.ts` | Export `colors`, `spacing`, `radius`, `sizes`. Replace the file header comment per DES-P1-001. Mark each invented token with an inline `// invented:` comment and its rationale. | `tsc --noEmit` passes. No token is unused at the end of Wave 6 (checked by `ts-prune` or manual grep). | See "Schemas" below for the exact token set. |
| TASK-P1-004 | Create `typography.ts` | `src/theme/typography.ts` | Export 11 type roles as `{ fontSize, lineHeight, letterSpacing, weight }`. `weight` is `400 \| 500`, never a `fontWeight` string. No `fontFamily`. | Every role's `lineHeight` is an integer. | See "Schemas". |
| TASK-P1-005 | Create `fonts.ts` | `src/theme/fonts.ts` | Export `useAppFonts()` (wraps `useFonts` with both families), `fontFamilyFor(weight, isArabic)`, and `LINE_HEIGHT_MULTIPLIER_AR = 1.15`. | If `useFonts` errors, return `{ loaded: true, failed: true }` and log once. Never block the app forever. | Family keys: `Inter_400Regular`, `Inter_500Medium`, `IBMPlexSansArabic_400Regular`, `IBMPlexSansArabic_500Medium`. |
| TASK-P1-006 | Create `elevation.ts` | `src/theme/elevation.ts` | Export `elevation.none` (`{}`) and `elevation.raised`. `raised` is the only shadow in the app. `shadowOffset.width` is always 0 so it needs no RTL mirroring. | Android branch sets `elevation`; iOS branch sets `shadow*`. Use `Platform.select`. | iOS: `{ shadowColor: colors.ink, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }`. Android: `{ elevation: 3 }`. |
| TASK-P1-007 | Create `theme/index.ts` | `src/theme/index.ts` | Re-export everything. All consumers import from `'../../theme'`. | No file outside `src/theme/` imports `theme/tokens` directly after Wave 6. | — |
| TASK-P1-008 | Add direction lint rules | `apps/mobile/.eslintrc.js` | Add `no-restricted-syntax` entries for physical-direction properties, `textAlign: 'left'\|'right'`, and hex color literals in `src/screens/**`. | `pnpm --filter mobile lint` fails on a deliberately added violation, then passes after removal. | See "Schemas" for the exact selectors. |
| TASK-P1-009 | Create `AppText` | `src/components/ui/Text.tsx` | Props: `variant` (a typography role, default `body`), `color` (a `colors` key, default `body`), plus all `TextProps`. Resolves `fontFamily` from `fontFamilyFor(role.weight, isArabic)`, multiplies `lineHeight` by 1.15 when Arabic, sets `maxFontSizeMultiplier: 1.6` and `writingDirection: 'auto'`. Never sets `textAlign`. | `variant` and `color` are typed unions; an unknown key is a compile error. | Exported as `Text` so screen diffs are import-line-only. |
| TASK-P1-010 | Create `Icon` | `src/components/ui/Icon.tsx` | Wraps `Feather` from `@expo/vector-icons`. Props: `name`, `size` (default 20), `color` (a `colors` key), `directional` (default false). When `directional && I18nManager.isRTL`, apply `transform: [{ scaleX: -1 }]`. | `directional` must be explicitly set for `chevron-*`, `arrow-*`, `send`, `corner-*`. A unit test asserts the flip. | Feather only; do not mix icon families. |
| TASK-P1-011 | Create `Screen` | `src/components/ui/Screen.tsx` | `SafeAreaView` with `backgroundColor: colors.canvas`, configurable `edges` (default `['bottom']`), optional `scroll` prop rendering a `ScrollView` with `contentContainerStyle: { padding: spacing.lg }`, and optional `footer` slot rendered in a `BottomActionBar`. | `keyboardShouldPersistTaps="handled"` when `scroll`. | Replaces the `SafeAreaView + ScrollView` pair repeated in 14 screens. |
| TASK-P1-012 | Create `format.ts` | `src/utils/format.ts` | `formatMoney(amount, currency, locale)` uses `Intl.NumberFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { style: 'currency', currency })`. `formatCount(n, locale)` same digit rule. | If `Intl` is unavailable, fall back to `${amount} ${currency}`. Unit test both locales. | DES-P1-015. |
| TASK-P1-013 | Gate the app on fonts | `src/App.tsx` | Call `useAppFonts()`; render `LoadingState` until `i18nReady && fontsResolved`. Change `<StatusBar style="auto" />` to `style="dark"`. | `LoadingState` must not import `AppText` (EDGE-P1-001). | — |
| TASK-P1-014 | Glyph-coverage check | scratch only | Render every value in `ar.json` once and confirm no missing-glyph boxes. Delete the scratch file before commit. | ASM-P1-002. | Not committed. |
| TASK-P1-058 | Bundle the font licenses *(added v1.1, Q1 approved)* | `apps/mobile/assets/fonts/LICENSES/OFL-Inter.txt`, `.../OFL-IBMPlexSansArabic.txt`, `apps/mobile/LICENSE` | Copy the SIL Open Font License text shipped with each `@expo-google-fonts` package into the repo, and add a "Bundled fonts" section to `apps/mobile/LICENSE` naming both families, their copyright holders, and the license. | The license text is copied verbatim from the package, not rewritten. | OFL 1.1 requires the notice to travel with the embedded font. |

**Wave 0 verification**: `pnpm --filter mobile typecheck && pnpm --filter mobile lint && pnpm --filter mobile test` all green. `npx expo config` shows `newArchEnabled: true`. App boots on iOS and Android in both locales with no visual change yet except the new font. Both OFL notices are present.

#### Wave 1 — Shared primitives + one screen

| ID | Task | File(s) | Responsibility / Expected Behavior | Validations / Error handling | Key Configurations |
|----|------|---------|-------------------------------------|------------------------------|--------------------|
| TASK-P1-015 | Redesign `Button` | `src/components/ui/Button.tsx` | Variants: `primary` (`button-primary`), `secondary` (`button-secondary`), `secondaryOnDark` (`button-secondary-on-dark`), `ghost` (invented: transparent, `link` label, for inline text actions), `danger` (invented). `minHeight: sizes.buttonHeight (48)`, `radius.lg`, `paddingHorizontal: spacing.lg`, `typography.button`. Optional `icon` + `iconPosition` using `flexDirection: 'row'` (auto-mirrors). Press-in `scale(0.97)` over 120 ms via a Reanimated CSS `transitionProperty`; primary background moves to `primaryActive`. Loading keeps the button width stable (absolute-positioned `ActivityIndicator` over a hidden label). Disabled per DES-P1-009. `fullWidth` prop, default true. | Keep `accessibilityRole="button"`; add `accessibilityState={{ disabled, busy: loading }}`. Label wraps to 2 lines max. | Never `radius.pill`. |
| TASK-P1-016 | Redesign `Card` | `src/components/ui/Card.tsx` | Add `tone` prop: `'canvas' \| 'soft' \| 'strong' \| 'cream' \| 'coral' \| 'forest' \| 'dark' \| 'peach' \| 'mint' \| 'yellow' \| 'mustard'` (default `canvas`). `canvas` keeps the hairline outline + `radius.md` + `padding: spacing.md`. Signature tones drop the border, use `radius.lg` for coral/forest/dark and `radius.md` for the pastels, and `padding: spacing.lg`. Export `cardTextColor(tone)` returning `onPrimary` for coral/forest/dark and `ink` otherwise. Export `PressableCard` with the same press scale as Button, `scale(0.97)` *(corrected v1.2: this row previously read 0.98, contradicting REQ-007 and the Motion Specification table. 0.97 is correct and is what shipped.)*. Tones `soft` and `strong` follow the pastel treatment: no border, `radius.md`, `padding: spacing.lg`. | `tone` is a typed union. A unit test asserts `cardTextColor` for all 11 tones. | Mobile padding is `spacing.lg` (24), not `DESIGN.md`'s 48. |
| TASK-P1-017 | Redesign `TextInput` | `src/components/ui/TextInput.tsx` | `minHeight: sizes.inputHeight (48)`, `radius.sm`, `paddingVertical: 12`, `paddingHorizontal: 16`, `borderWidth: 1`, `borderColor: colors.inputBorder`. Focus: `borderWidth: 2` + `borderColor: colors.infoBorder`, with `paddingHorizontal: 15` / `paddingVertical: 11` so the box does not resize. Error: `borderColor: colors.danger`. Disabled: `backgroundColor: colors.surfaceSoft`, `borderColor: colors.hairline`. Multiline: `minHeight: 96`, `textAlignVertical: 'top'`. Placeholder in `colors.muted`. Add optional `hint`. Never set `textAlign`. | Keep `accessibilityLabel={label}` and `accessibilityRole="alert"` on the error. Add `accessibilityHint` from `hint`. | Focus tracked with local `onFocus`/`onBlur` state; no animation (a border color change under 150 ms is below the animate gate). |
| TASK-P1-018 | Redesign `ChipSelect` | `src/components/forms/ChipSelect.tsx` | Chip `height: 36` with `hitSlop: { top: 4, bottom: 4 }` to reach 44. `radius.full` (DES-P1-010), `paddingHorizontal: spacing.sm`. Unselected: `canvas` + `inputBorder` + `body` label. Selected: `primary` + `onPrimary` label, and in multi-select a leading `check` icon (non-directional). Press-in `scale(0.97)`, 120 ms. Row keeps `flexDirection: 'row'`, `flexWrap: 'wrap'`, `gap: spacing.xs`. | Preserve `accessibilityState={{ selected }}`. Add `accessibilityRole="button"` (already present). | EDGE-P1-005: keep wrapping, do not add horizontal scroll. |
| TASK-P1-019 | Redesign `EmptyState` | `src/components/ui/EmptyState.tsx` | `Card tone="cream"` (`cream-callout-card`), centered: a 40pt non-directional Feather icon in `ink`, a `titleSm` headline, a `body` sub-line in `body`, an optional primary `Button`. New props: `icon`, `title`, `message`, `action`. Entrance: fade + `translateY: 8 -> 0`, 250 ms, `EASE_OUT`; opacity-only under reduced motion. | New i18n keys for default title and message in `en` and `ar`. Keep the existing `message` prop working. | The only cream surface allowed on a list screen. |
| TASK-P1-020 | Redesign `ErrorState` | `src/components/ui/ErrorState.tsx` | Canvas, not cream. `alert-triangle` icon in `danger`, `titleSm` headline in `ink`, `body` detail in `body`, secondary "Retry" `Button`. No animation. | Keep `accessibilityRole="alert"`. | Reserve cream for neutral/positive. |
| TASK-P1-021 | Redesign `LoadingState` | `src/components/ui/LoadingState.tsx` | Canvas, `ActivityIndicator` in `colors.primary`, caption in `colors.muted`. Uses raw RN `Text`, not `AppText`. | EDGE-P1-001. | — |
| TASK-P1-022 | Extend `QueryStateView` | `src/components/ui/QueryStateView.tsx` | Add optional `skeleton?: ReactNode` rendered instead of `LoadingState` when provided. No other change. | Behavior is identical when `skeleton` is omitted. | — |
| TASK-P1-023 | Create `StatusBadge` | `src/components/ui/StatusBadge.tsx` | Props: `status: string`, `domain: 'campaign' \| 'proposal' \| 'collaboration' \| 'deliverable'`. Renders a `radius.full` pill, `paddingVertical: 4`, `paddingHorizontal: spacing.xs`, `typography.overline`. Exports `statusTone(domain, status)`. Label from `t(...)`. | EDGE-P1-007: unknown status -> neutral tone + raw key, never a crash. Unit test the default branch. | Tone map in "Schemas". |
| TASK-P1-024 | Create `SectionHeader` | `src/components/ui/SectionHeader.tsx` | `titleLg` heading + optional `caption` sub-line + optional trailing action slot. Row uses `flexDirection: 'row'`, `justifyContent: 'space-between'` (auto-mirrors). | `accessibilityRole="header"`. | — |
| TASK-P1-025 | Create `BottomActionBar` | `src/components/ui/BottomActionBar.tsx` | Sticky footer: `backgroundColor: canvas`, `borderTopWidth: StyleSheet.hairlineWidth`, `borderTopColor: hairline`, `padding: spacing.md`, bottom safe-area inset via `useSafeAreaInsets`, `elevation.raised`. Children laid out in a `row` with `gap: spacing.sm`. | Height never collapses under the home indicator. | Replaces ad-hoc `navRow` in the wizard and detail screens. |
| TASK-P1-026 | Create `SuccessPanel` | `src/components/ui/SuccessPanel.tsx` | The one voltage component. `Card tone="forest"` filling the screen center: `check-circle` icon in `onPrimary`, `titleLg` headline, `body` detail, `Button variant="secondaryOnDark"`. Entrance: `scale 0.96 -> 1` + fade, spring `{ duration: 400, dampingRatio: 0.8 }`, plus `Haptics.notificationAsync(Success)` fired once. | EDGE-P1-006: `useReducedMotion()` -> opacity only; haptic still fires. Guard the haptic with a `useRef` so a re-render cannot double-fire it. | Used by exactly four screens (REQ-011). |
| TASK-P1-027 | Restyle `LoginScreen` | `src/screens/auth/LoginScreen.tsx` | First screen through the new stack: `Screen scroll`, `AppText`, new `Button`, new `FormTextInput`. Replace the plain-`Text` "no account" link with `Button variant="ghost"`. Zero behavior change. | `pnpm --filter mobile test` — the 3 Login test files must pass unchanged, or with query fixes only. | The Wave 1 acceptance gate. |
| TASK-P1-028 | Restyle `ErrorBoundary` | `src/components/ErrorBoundary.tsx` | Use `Screen` + `AppText` + new `Button`. Keep the class component and the `logger.error` call. | Behavior unchanged. | — |
| TASK-P1-059 | **Design review checkpoint — hard stop** *(added v1.1, Q5 approved)* | no files | Present 4 screenshots of `LoginScreen` (en/ar x iOS/Android) plus the rendered `Button`, `Card` tone set, `TextInput` states, `ChipSelect`, `EmptyState`, `ErrorState`, `StatusBadge` tone map, and `SuccessPanel`. Get an explicit accept or reject on the visual direction. | **Waves 2 through 6 do not start until this returns accept.** A reject costs one screen of rework, not eighteen. | Record the outcome as a new row in the Decisions table with the date. |

**Implementation status (2026-09-03)**: TASK-P1-015 through TASK-P1-028 are implemented and verified — `pnpm --filter mobile typecheck && lint && test` all green (59/59 tests, 11 suites). Unit tests added for `cardTextColor()` (all 11 tones), `statusTone()` (all known statuses + the unknown-status default branch), and `SuccessPanel`'s reduced-motion haptic-guard branch. TASK-P1-059 is **not yet resolved**: it requires a human accept/reject on-device and is out of scope for an agent to self-approve. See the Wave 1 review package delivered alongside this plan for the visual-spec writeup and the manual checks a human must still run.

**Wave 1 verification**: typecheck, lint, test green. Screenshot pair of `LoginScreen` in `en` and `ar`, on iOS and Android, at default and 200% font scale. Press feedback confirmed on a physical device in a release build. TASK-P1-059 returns accept.

#### Wave 2 — Auth

| ID | Task | File(s) | Responsibility / Expected Behavior | Validations / Error handling | Key Configurations |
|----|------|---------|-------------------------------------|------------------------------|--------------------|
| TASK-P1-029 | Restyle `RoleSelectScreen` | `src/screens/auth/RoleSelectScreen.tsx` | The app's only `hero-band`: canvas, vertically centered, 96pt of whitespace above the headline (DES-P1-006's one exception). `displayMd` headline in `ink`, `body` sub-line in `muted`. The two role choices become `PressableCard`s, brand = `tone="peach"`, creator = `tone="mint"`, each with an icon, a `titleSm` label, and a one-line `body` description. "I already have an account" becomes `Button variant="ghost"`. | Two cards -> two 44pt+ targets. Keep the existing navigation params. | One signature surface budget: the two pastel cards count as one grid, per `demo-grid-card`. |
| TASK-P1-030 | Restyle `RegisterScreen` | `src/screens/auth/RegisterScreen.tsx` | `Screen scroll`, `SectionHeader`, new form primitives, `BottomActionBar` for the submit action. Canvas only. | `RoleSelectScreen.test.tsx` passes. | Neutral screen. |
| TASK-P1-031 | Add auth i18n keys | `src/i18n/{en,ar}.json` | Role-card descriptions, accessibility labels. | Both files updated in the same commit (CON-001). | — |

#### Wave 3 — Navigation chrome

| ID | Task | File(s) | Responsibility / Expected Behavior | Validations / Error handling | Key Configurations |
|----|------|---------|-------------------------------------|------------------------------|--------------------|
| TASK-P1-032 | Create `screenOptions.ts` | `src/navigation/screenOptions.ts` | Export `stackScreenOptions` and `tabBarOptions`. Stack: `headerStyle: { backgroundColor: colors.canvas }`, `headerShadowVisible: false`, `headerTintColor: colors.ink`, `headerTitleStyle: { fontFamily: <resolved 500>, fontSize: 17 }`, `headerBackButtonDisplayMode: 'minimal'`. Tabs: `tabBarActiveTintColor: colors.ink`, `tabBarInactiveTintColor: colors.muted`, `tabBarStyle: { backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline, height: sizes.tabBarHeight }`, `tabBarLabelStyle: typography.overline`, `animation: 'none'`. | `animation: 'none'` is set explicitly, not left to the default (REQ-008). Header font family resolves after fonts load; import from `fonts.ts`, do not hard-code. | No header border: `DESIGN.md`'s `top-nav` is flat. |
| TASK-P1-033 | Restyle `BrandTabNavigator` | `src/navigation/BrandTabNavigator.tsx` | Apply `tabBarOptions`. Add `tabBarIcon` per tab: Campaigns = `radio`, Products = `package`, Profile = `user`. All non-directional. Apply `stackScreenOptions` to all three inner stacks. | 3 tabs, under the 5 maximum. Keep every `ErrorBoundary` wrapper and every screen registration exactly as-is. | — |
| TASK-P1-034 | Restyle `CreatorTabNavigator` | `src/navigation/CreatorTabNavigator.tsx` | Same, with Browse = `search`, Applications = `send` (**directional**, must flip in RTL), Collaborations = `briefcase`, Profile = `user`. | 4 tabs. | The `send` icon is the one flipping tab icon. |
| TASK-P1-035 | Restyle `AuthStack` | `src/navigation/AuthStack.tsx` | Apply `stackScreenOptions`. `RoleSelect` keeps `headerShown: false`. | — | — |
| TASK-P1-036 | Theme `NavigationContainer` | `src/navigation/RootNavigator.tsx` | Pass a `Theme` object built from tokens (`background: canvas`, `card: canvas`, `text: ink`, `border: hairline`, `primary: ink`, `notification: danger`) so the native container background matches during transitions. | No behavior change to the role branch. | Prevents a gray flash between screens. |

**Wave 3 verification**: tab switch is instant with no animation, confirmed on device. Back chevron points right in Arabic on both platforms. Tab order mirrors in Arabic.

#### Wave 4 — List screens (neutral: canvas, hairline, StatusBadge)

| ID | Task | File(s) | Responsibility / Expected Behavior | Validations / Error handling | Key Configurations |
|----|------|---------|-------------------------------------|------------------------------|--------------------|
| TASK-P1-037 | Restyle `CampaignsListScreen` | `src/screens/brand/CampaignsListScreen.tsx` | `PressableCard` rows with `titleSm` title, `StatusBadge` (domain `campaign`), `caption` meta. Move "Create campaign" out of the scroll header into a `BottomActionBar`. Add `RefreshControl` tinted `primary`. | Preserve the `draft -> wizard` / `else -> proposals` routing. | Canvas + hairline only. |
| TASK-P1-038 | Restyle `ProductsListScreen` | `src/screens/brand/ProductsListScreen.tsx` | Same pattern, no badge. `EmptyState` gets an icon and a CTA to add the first product. | — | Canvas. |
| TASK-P1-039 | Restyle `ProposalsInboxScreen` | `src/screens/brand/ProposalsInboxScreen.tsx` | Card per proposal: `formatMoney` price as `titleSm`, `StatusBadge` (domain `proposal`), `body` pitch clamped to 3 lines, `caption` delivery days. Action row -> one primary (`Accept`) plus two `secondary` in a wrapping row with `gap`. | The one-primary-per-viewport rule: only `Accept` is `variant="primary"`. | Canvas. |
| TASK-P1-040 | Restyle `CampaignBrowseScreen` | `src/screens/creator/CampaignBrowseScreen.tsx` | Filter row uses the new `ChipSelect` in a fixed header block above the list; "Clear" becomes `Button variant="ghost"`. Cards get `titleSm` + `caption` meta + `StatusBadge`. `RefreshControl`. | Preserve the creator-niche default and override logic. | Canvas. |
| TASK-P1-041 | Restyle `MyProposalsScreen` | `src/screens/creator/MyProposalsScreen.tsx` | Card + `formatMoney` + `StatusBadge` (domain `proposal`). | — | Canvas. |
| TASK-P1-042 | Restyle `MyCollaborationsScreen` | `src/screens/creator/MyCollaborationsScreen.tsx` | Card + `formatMoney` + `StatusBadge` (domain `collaboration`) + action row. | Preserve the conditional Upload / Chat actions. | Canvas. |
| TASK-P1-043 | Add `ListSkeleton` (optional, P2) | `src/components/ui/ListSkeleton.tsx` | Three hairline placeholder cards with a 1000 ms opacity pulse (Reanimated CSS animation). Wire into the 6 list screens via `QueryStateView`'s `skeleton` prop. | Skipped entirely under reduced motion (render static placeholders). | Ship only if Wave 4 lands early. |
| TASK-P1-044 | List i18n + status keys | `src/i18n/{en,ar}.json` | Every status label for all four domains, in both languages. | `StatusBadge` never renders a raw key in normal operation. | — |

#### Wave 5 — Form and detail screens (neutral, with two cream moments)

| ID | Task | File(s) | Responsibility / Expected Behavior | Validations / Error handling | Key Configurations |
|----|------|---------|-------------------------------------|------------------------------|--------------------|
| TASK-P1-045 | Restyle `ProductFormScreen` | `src/screens/brand/ProductFormScreen.tsx` | `Screen scroll` + `SectionHeader` + form primitives + `BottomActionBar` save. | — | Canvas. |
| TASK-P1-046 | Restyle `BrandProfileScreen` | `src/screens/brand/BrandProfileScreen.tsx` | Same. Logout becomes `Button variant="ghost"` at the bottom, visually separated by a hairline divider. | — | Canvas. |
| TASK-P1-047 | Restyle `CreatorProfileScreen` | `src/screens/creator/CreatorProfileScreen.tsx` | Split into `SectionHeader`-led blocks: Profile, Portfolio, Payout link, Sign out. Portfolio items become `Card tone="canvas"` rows. The nested `FlatList` inside a `ScrollView` stays as-is (data volume is tiny); do not refactor it in this plan. | Preserve `SEC-002`: no payout value renders here, only a navigation link. | Canvas. |
| TASK-P1-048 | Restyle `PayoutDetailsScreen` | `src/screens/creator/PayoutDetailsScreen.tsx` | Form primitives + `BottomActionBar`. The "saved" confirmation becomes an inline `SuccessPanel`-lite: a `Card tone="forest"` strip, not a full-screen panel (this screen stays reachable after saving). | REQ-011. Preserve `SEC-002`. | One forest strip. |
| TASK-P1-049 | Restyle `CampaignDetailApplyScreen` | `src/screens/creator/CampaignDetailApplyScreen.tsx` | The brief block (script, talking points, do-not-say) becomes `Card tone="cream"` — the `cream-callout-card` role. The apply form stays on canvas below it. Success -> full-screen `SuccessPanel`. | REQ-011, DES-P1-011 (cream and forest never render at the same time; success replaces the screen body). | One cream, or one forest. |
| TASK-P1-050 | Restyle `CollaborationDetailScreen` | `src/screens/brand/CollaborationDetailScreen.tsx` | Escrow summary (status + amount) becomes `Card tone="cream"`. Shipment form and deliverable review stay canvas `Card`s with `SectionHeader`s. Approve is the one `primary`; request-revision and decline are `secondary` / `danger`. Actions move to `BottomActionBar`. | Preserve the exact status-gated rendering of each block. | One cream. |
| TASK-P1-051 | Restyle `DeliverableUploadScreen` | `src/screens/creator/DeliverableUploadScreen.tsx` | Progress track: `radius.full`, `surfaceSoft` track, `primary` fill, `alignItems: 'flex-start'` so it fills from the reading start (EDGE / R7). Fill is an absolutely positioned child with an animated `width` — the documented layout-animation exception, `linear` easing. File chip shows name + size. Success -> full-screen `SuccessPanel`. | REQ-011. Preserve the strict `upload -> then register` ordering. | One forest. |
| TASK-P1-052 | Form/detail i18n | `src/i18n/{en,ar}.json` | New section headings and success copy. | — | — |

#### Wave 6 — Voltage moments and chat

| ID | Task | File(s) | Responsibility / Expected Behavior | Validations / Error handling | Key Configurations |
|----|------|---------|-------------------------------------|------------------------------|--------------------|
| TASK-P1-053 | Restyle `CampaignWizardScreen` | `src/screens/brand/CampaignWizardScreen.tsx` | Add a step indicator: 5 segments, active = `primary`, complete = `success`, pending = `hairline`, `radius.full`, laid out in a `row` (auto-mirrors). Each step body is unchanged logically. Step change animates: cross-fade 200 ms `EASE_OUT` + `translateX` of 8pt in the reading direction (sign flipped by `I18nManager.isRTL`). Nav buttons move to `BottomActionBar`; `Back` is `secondary`, `Next`/`Publish` is `primary`. The Review step's summary becomes `Card tone="coral"` with white type — the brand's one coral moment. | Preserve every `trigger()` / `handleSubmit` / `setError` path and the `campaignIdRef` create-on-first-next behavior exactly. | One coral. Reduced motion -> cross-fade only, no translate. |
| TASK-P1-054 | Restyle `AcceptProposalScreen` | `src/screens/brand/AcceptProposalScreen.tsx` | Restyle the four wrapper states only. `funded` -> `SuccessPanel` (forest, REQ-011). `failed` and `timeout` -> `ErrorState` with a retry/back action. `waiting` -> `LoadingState` with a specific caption. The `<WebView>` branch keeps `flex: 1` and no added chrome. | EDGE-P1-009: Paymob's page is not restyled. Preserve the `status === 'funded'` guard exactly; no other status may show success. | One forest. |
| TASK-P1-055 | Restyle `ChatScreen` | `src/screens/shared/ChatScreen.tsx` | Bubbles: `radius.md` with logical asymmetric corners (`borderStartStartRadius` / `borderEndEndRadius`), mine = `primary` + `onPrimary`, theirs = `surfaceSoft` + `ink`. `alignSelf: 'flex-end' \| 'flex-start'` already mirrors — keep it. Composer: hairline top border, `TextInput` + icon-only `Button` with a **directional** `send` icon. New messages enter with `FadeIn.duration(150)`. Connection error becomes an inline `danger` strip. | Preserve the Ably subscribe/unsubscribe lifecycle and the publish-then-persist ordering. | Canvas. No signature surface. |
| TASK-P1-056 | Final sweep | all of `src/screens/**`, `src/components/**` | Grep for remaining hex literals, `fontSize:`, `fontWeight:`, `shadow`, `elevation`, and physical-direction properties outside `src/theme/`. Remove every one. | `pnpm --filter mobile lint` passes with the Wave 0 rules active across the whole tree. | PAT-001. |
| TASK-P1-057 | Update mobile agent notes | `apps/mobile/AGENTS.md` | Record the token import path, the direction rules, the motion gate, and the "screens compose primitives" rule so the next agent does not reintroduce raw styles. | Kept short; links to this plan and to `DESIGN.md`. | — |

### Schemas

#### `src/theme/tokens.ts` — colors

```ts
// Every value below is DESIGN.md's, except where marked "invented".
{
  // Brand & accent
  primary:            '#181d26',
  primaryActive:      '#0d1218',

  // Surfaces
  canvas:             '#ffffff',
  surfaceSoft:        '#f8fafc',
  surfaceStrong:      '#e0e2e6',
  surfaceDark:        '#181d26',
  surfaceDarkElevated:'#1d1f25',
  hairline:           '#dddddd',   // decorative dividers + card outlines ONLY

  // Text
  ink:                '#181d26',
  body:               '#333840',
  muted:              '#41454d',   // note: darker than the old #6b7280 (9.4:1 vs 4.8:1)
  borderStrong:       '#9297a0',
  onPrimary:          '#ffffff',
  onDark:             '#ffffff',

  // Signature card surfaces (brand voltage; full-bleed surfaces, never small accents)
  signatureCoral:     '#aa2d00',
  signatureForest:    '#0a2e0e',
  signatureCream:     '#f5e9d4',
  signaturePeach:     '#fcab79',
  signatureMint:      '#a8d8c4',
  signatureYellow:    '#f4d35e',
  signatureMustard:   '#d9a441',

  // Semantic
  link:               '#1b61c9',
  linkActive:         '#1a3866',
  info:               '#254fad',
  infoBorder:         '#458fff',
  success:            '#006400',
  successBorder:      '#39bf45',

  // invented: DESIGN.md has no error color. Coral is a brand surface, not an error tone. (DES-P1-008)
  danger:             '#b3261e',
  dangerSurface:      '#fdecea',
  // invented: hairline (1.36:1) and borderStrong (2.93:1) both fail WCAG 1.4.11's 3:1
  // for non-text UI that conveys state. This is 3.25:1. (DES-P1-007)
  inputBorder:        '#8a8f99',
}
```

Verified contrast ratios against `canvas` `#ffffff` (recompute with a checker before sign-off):

| Pair | Ratio | Verdict |
|---|---|---|
| `ink` on `canvas` | 16.7:1 | AAA |
| `body` on `canvas` | 11.5:1 | AAA |
| `muted` on `canvas` | 9.4:1 | AAA |
| `link` on `canvas` | 5.8:1 | AA |
| `danger` on `canvas` | 6.5:1 | AA |
| `success` on `canvas` | 7.4:1 | AAA |
| `info` on `canvas` | 7.5:1 | AAA |
| `onPrimary` on `primary` | 16.7:1 | AAA |
| `onPrimary` on `signatureCoral` | 6.8:1 | AA (fails AAA body) |
| `onPrimary` on `signatureForest` | 14.9:1 | AAA |
| `ink` on `signatureCream` | 13.9:1 | AAA |
| `ink` on `signaturePeach` | 9.0:1 | AAA |
| `ink` on `signatureMint` | 10.6:1 | AAA |
| `ink` on `signatureYellow` | 11.4:1 | AAA |
| `ink` on `signatureMustard` | 7.4:1 | AAA |
| `inputBorder` on `canvas` | 3.25:1 | passes 1.4.11 |
| `borderStrong` on `canvas` | 2.93:1 | **fails** 1.4.11 — decorative use only |
| `hairline` on `canvas` | 1.36:1 | **fails** 1.4.11 — decorative use only |

Rules that follow: never put text on `signatureCoral` at a size below 16pt/500 if AAA is later required; never use `hairline` or `borderStrong` as an input outline.

#### `src/theme/tokens.ts` — spacing, radius, sizes

```ts
spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48, section: 96 }
// Mobile band rhythm is spacing.xxl (48). spacing.section (96) is reserved for the
// auth hero's vertical centering only. (DES-P1-006)

radius = { xs: 2, sm: 6, md: 10, lg: 12, pill: 9999, full: 9999 }
// pill/full: chips, filters, badges, avatars, progress tracks. NEVER buttons. (DES-P1-010)

sizes = {           // invented: DESIGN.md has no mobile sizing scale
  touchMin:      44,  // WCAG 2.5.8 / Apple HIG minimum
  buttonHeight:  48,  // DESIGN.md's own touch-target note says 48
  inputHeight:   48,  // raised from DESIGN.md's 44 for thumb accuracy
  iconButton:    44,  // raised from DESIGN.md's 40, which is under the WCAG minimum
  tabBarHeight:  56,
  hairlineWidth: StyleSheet.hairlineWidth,
}
```

#### `src/theme/typography.ts`

```ts
// weight is 400 | 500 only. No 600 anywhere in the app: DESIGN.md reserves 600 for
// legal surfaces, which this app does not have. No fontFamily here (DES-P1-004).
{
  displayLg:  { fontSize: 32, lineHeight: 38, letterSpacing: 0,    weight: 400 }, // <- display-lg 40
  displayMd:  { fontSize: 28, lineHeight: 34, letterSpacing: 0,    weight: 400 }, // <- display-md 32
  titleLg:    { fontSize: 22, lineHeight: 30, letterSpacing: 0.12, weight: 400 }, // <- title-lg 24
  titleMd:    { fontSize: 20, lineHeight: 28, letterSpacing: 0,    weight: 400 }, // <- title-md 20
  titleSm:    { fontSize: 17, lineHeight: 24, letterSpacing: 0,    weight: 500 }, // <- title-sm 18
  label:      { fontSize: 16, lineHeight: 22, letterSpacing: 0,    weight: 500 }, // <- label-md 16
  button:     { fontSize: 16, lineHeight: 22, letterSpacing: 0,    weight: 500 }, // <- typography.button
  body:       { fontSize: 15, lineHeight: 22, letterSpacing: 0,    weight: 400 }, // <- body-md 14/1.25
  bodySm:     { fontSize: 13, lineHeight: 19, letterSpacing: 0,    weight: 400 }, // invented
  caption:    { fontSize: 13, lineHeight: 18, letterSpacing: 0.16, weight: 500 }, // <- caption 14
  overline:   { fontSize: 11, lineHeight: 14, letterSpacing: 0.8,  weight: 500 }, // invented: badges, tab labels
}
// Arabic multiplies every lineHeight by 1.15 in AppText. (DES-P1-003)
// DESIGN.md's pricing roles (pricing-display 44.8/475, pricing-section 28/475,
// pricing-card-title 20/475) are deliberately absent. (DES-P1-002)
```

#### `StatusBadge` tone map

| Domain | Status | Background | Text |
|---|---|---|---|
| campaign | `draft` | `surfaceStrong` | `body` |
| campaign | `live` | `signatureMint` | `ink` |
| campaign | `closed` / `archived` | `surfaceStrong` | `muted` |
| proposal | `applied` | `signatureYellow` | `ink` |
| proposal | `shortlisted` | `signatureMustard` | `ink` |
| proposal | `accepted` | `signatureForest` | `onPrimary` |
| proposal | `declined` | `dangerSurface` | `danger` |
| collaboration | `pending_payment` | `signatureYellow` | `ink` |
| collaboration | `funded` | `signatureForest` | `onPrimary` |
| collaboration | `shipped` / `in_progress` | `signatureMint` | `ink` |
| collaboration | `delivered` | `signaturePeach` | `ink` |
| collaboration | `approved` | `signatureForest` | `onPrimary` |
| collaboration | `payment_failed` / `cancelled` | `dangerSurface` | `danger` |
| deliverable | `submitted` | `signaturePeach` | `ink` |
| deliverable | `revision_requested` | `signatureMustard` | `ink` |
| deliverable | `approved` | `signatureForest` | `onPrimary` |
| deliverable | `declined` | `dangerSurface` | `danger` |
| *(any)* | unknown | `surfaceStrong` | `body` |

This is the only place the pastel signature surfaces (`peach`, `mint`, `yellow`, `mustard`) appear outside the `RoleSelect` role cards. They are the app's status vocabulary, which is a legitimate `demo-grid-card` analogue: small surfaces carrying a fragment of state.

#### ESLint additions (`apps/mobile/.eslintrc.js`)

```js
rules: {
  'no-restricted-syntax': ['error',
    {
      selector: "Property[key.name=/^(marginLeft|marginRight|paddingLeft|paddingRight|borderLeftWidth|borderRightWidth|borderLeftColor|borderRightColor|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius)$/]",
      message: 'Use the direction-aware property (marginStart/End, paddingStart/End, borderStartStartRadius, ...). Physical directions break Arabic RTL.',
    },
    {
      selector: "Property[key.name=/^(left|right)$/][value.type='Literal']",
      message: "Use 'start'/'end' instead of 'left'/'right' for positioning. Physical directions break Arabic RTL.",
    },
    {
      selector: "Property[key.name='textAlign'][value.value=/^(left|right)$/]",
      message: "Omit textAlign (React Native's default is direction-aware) or use 'center'.",
    },
  ],
}
// plus, scoped by an `overrides` block to src/screens/** and src/components/**:
// 'no-restricted-syntax' entry for Literal values matching /^#[0-9a-fA-F]{3,8}$/
//   message: 'Import the color from ../../theme. Screens must not declare raw hex.' (PAT-001)
```

### Data Models & flows

<settings>

- `apps/mobile/package.json`: add DEP-001..DEP-007.
- `apps/mobile/app.json`: **no change**. `userInterfaceStyle` stays `"light"` (DES-P1-013). `newArchEnabled` is already `true`.
- `apps/mobile/.eslintrc.js`: add the rules above.
- No `babel.config.js` is added. `babel-preset-expo` handles the worklets plugin.
- No environment variable changes. No `app.config.ts` change.

</settings>

<Data-Models>

No API model, DTO, or database schema changes. This plan adds one client-side derived type only:

```ts
type Tone =
  | 'canvas' | 'soft' | 'strong'
  | 'cream' | 'coral' | 'forest' | 'dark'
  | 'peach' | 'mint' | 'yellow' | 'mustard';

type TypographyRole = keyof typeof typography;   // 11 roles
type ColorRole      = keyof typeof colors;       // 30 tokens
```

</Data-Models>

<Data-flow>

Font and direction resolution at app start:

```
App mount
   │
   ├─ initI18n()                       [existing]
   │     ├─ read persisted locale from SecureStore
   │     ├─ i18next.init({ lng })
   │     └─ applyLayoutDirection(locale) -> I18nManager.forceRTL(isRtl)
   │            (a direction change requires an app reload — already handled)
   │
   ├─ useAppFonts()                    [new, TASK-P1-005]
   │     └─ Font.useFonts({ Inter_400Regular, Inter_500Medium,
   │                        IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium })
   │
   └─ both resolved? ──no──> <LoadingState/>   (raw RN Text, no AppText — EDGE-P1-001)
                     │
                    yes
                     ▼
             <RootNavigator/>
                     │
      every <AppText variant color> render:
                     │
        ┌────────────┴──────────────────────────────┐
        │ isArabic = I18nManager.isRTL               │
        │ role     = typography[variant]             │
        │ family   = fontFamilyFor(role.weight,      │
        │                          isArabic)          │
        │ lineH    = role.lineHeight * (isArabic     │
        │                               ? 1.15 : 1)   │
        └────────────────────────────────────────────┘
```

Signature-surface budget per screen (DES-P1-011), the one visual rule a reviewer checks per screen:

```
   coral   ──▶ RoleSelect hero? no.  CampaignWizard review step. ....... 1 screen
   forest  ──▶ AcceptProposal funded · DeliverableUpload success ·
               CampaignDetailApply applied · PayoutDetails saved ....... 4 screens
   cream   ──▶ EmptyState (any list) · CampaignDetailApply brief ·
               CollaborationDetail escrow summary ..................... 3 contexts
   dark    ──▶ (unused in Phase 1; reserved)
   pastels ──▶ StatusBadge tones · RoleSelect role cards ............... 2 contexts
   canvas  ──▶ everything else
```

</Data-flow>

---

## RTL Specification

`DESIGN.md` contains zero RTL guidance. Arabic is the **primary** locale per `HLD.md` (REQ-008, GUD-001, NFR "Localization: Arabic (primary) and English, full RTL support"). Every rule below is normative.

### Direction rules (R1–R10)

| ID | Rule | Enforcement |
|----|------|-------------|
| R1 | Never write `marginLeft/Right`, `paddingLeft/Right`, `left`/`right` positioning, or `borderLeft*/Right*`. Use `marginStart/End`, `paddingStart/End`, `start`/`end`, `borderStartWidth`, `borderStartStartRadius`. | ESLint (TASK-P1-008) |
| R2 | Never set `textAlign: 'left'` or `'right'`. React Native's unset default is direction-aware; `'center'` is safe. `AppText` never sets it. | ESLint |
| R3 | `flexDirection: 'row'` mirrors automatically under `I18nManager.isRTL`. Never write a conditional `row-reverse`. | Review |
| R4 | Directional icons flip: `chevron-left/right`, `arrow-left/right`, `send`, `corner-up-left`. Non-directional icons never flip: `search`, `user`, `package`, `briefcase`, `check`, `alert-triangle`, `radio`. Flipping goes through `<Icon directional />`, never a hand-written transform. | `Icon` API + unit test |
| R5 | `shadowOffset.width` is always 0 so elevation needs no mirroring. Only `elevation.raised` exists and it satisfies this. | `elevation.ts` |
| R6 | Money and counts render Latin digits in Arabic (`ar-EG-u-nu-latn`) and live in their own `AppText` with `writingDirection: 'auto'`. Never string-concatenate a number into a translated sentence. | `formatMoney` + review (EDGE-P1-004) |
| R7 | Progress and range fills start from the reading start: `alignItems: 'flex-start'` on the track with an animated-width absolute fill, never `left: 0`. | Review |
| R8 | Chat bubbles keep `alignSelf: 'flex-end' \| 'flex-start'` (already direction-aware). Asymmetric corners use logical radii. | TASK-P1-055 |
| R9 | Arabic line height is Latin x 1.15. Applied once, in `AppText`. | `AppText` |
| R10 | Every wave ends with a screenshot pair (`en` + `ar`) on iOS and Android. Switching locale requires an app reload, which is existing behavior. | Wave gate |

### Per-component RTL behavior

| Component | Layout mirroring | Text alignment | Icon direction | Notes |
|---|---|---|---|---|
| `AppText` | n/a | `writingDirection: 'auto'`, no `textAlign` | n/a | Also applies the 1.15 Arabic line-height multiplier |
| `Button` | Label centered; `icon` sits in a `row` that auto-mirrors | centered | Directional icons flip via `Icon` | Full-width by default, so asymmetry rarely arises |
| Button **pair** | `DESIGN.md` anchors the primary + secondary pair to the left on web. On mobile the pair is a full-width `row` with `gap`, primary at the **end** (reading-end), which auto-mirrors. Stacked vertically when labels are long. | — | — | This is the concrete adaptation of `DESIGN.md`'s asymmetric button row |
| `Card` / `PressableCard` | Padding via `padding` (symmetric) — no mirroring needed | children handle their own | — | A trailing chevron uses `Icon directional` |
| `TextInput` | `paddingHorizontal` is symmetric | RN default (direction-aware) | Trailing clear/eye icon sits at the reading end via `flexDirection: 'row'` | `secureTextEntry` toggle is non-directional |
| `ChipSelect` | `row` + `wrap` + `gap` auto-mirrors | RN default | Leading `check` is non-directional | EDGE-P1-005: keep wrapping, do not scroll |
| `EmptyState` / `ErrorState` / `LoadingState` / `SuccessPanel` | centered column | `textAlign: 'center'` | non-directional icons only | Centered layouts are direction-neutral by construction |
| `StatusBadge` | pill, symmetric padding | RN default | — | Label must not contain a bare number (R6) |
| `SectionHeader` | `row` + `space-between` auto-mirrors | RN default | trailing action flips position automatically | — |
| `BottomActionBar` | `row` + `gap` auto-mirrors; safe-area inset is vertical only | — | — | — |
| Bottom tab bar | React Navigation lays tabs in a `row`; order mirrors automatically | `overline`, centered | Creator "Applications" `send` icon is the one flipping tab icon | Verify tab order on both platforms |
| Native stack header | `react-native-screens` mirrors the native header and back chevron from `I18nManager` | native | native | Verify on Android specifically; do not hand-roll a back button |
| Wizard step indicator | `row` auto-mirrors, so step 1 sits at the reading start | — | — | The `translateX` step transition flips sign with `I18nManager.isRTL` |

### RTL verification checklist (run per wave)

1. Set locale to `ar`, reload the app.
2. Confirm every row reads right-to-left and no element is clipped at either edge.
3. Confirm the back chevron and the chat send icon point right.
4. Confirm prices show Latin digits and stay unbroken inside Arabic sentences.
5. Confirm no horizontal scroll appears on any screen (Arabic labels run longer than English).
6. Repeat on the other platform.

---

## Motion Specification

Gate every animation through the `animate-expo` frequency table before writing it. The default answer is no animation.

| Interaction | Frequency tier | Decision | Config |
|---|---|---|---|
| Bottom tab switch | 100+/day | **None** | `animation: 'none'`, set explicitly (REQ-008) |
| Native stack push/pop | 100+/day | **Platform default**, never overridden | — |
| Keyboard show/hide | 100+/day | **None** beyond `KeyboardAvoidingView` | — |
| Scroll / `FlatList` | 100+/day | **None** | — |
| `Button` / `PressableCard` / chip press | tens/day | Press-**in** `scale(0.97)` | Reanimated CSS `transitionProperty: 'transform'`, 120 ms, `EASE_OUT`. Purpose: feedback |
| Input focus border | tens/day | **None** (a color change under 150 ms is below the gate) | — |
| Wizard step change | occasional | Cross-fade + `translateX` 8pt in the reading direction | 200 ms, `EASE_OUT`, sign flipped by `I18nManager.isRTL`. Purpose: spatial consistency |
| List item entrance | tens/day | `FadeInDown`, staggered, capped at the first 8 rows | `.duration(220).delay(index * 40)`, `index < 8`. Purpose: preventing a jarring change. **P2 — ship only with TASK-P1-043** |
| `EmptyState` appearance | occasional | Fade + `translateY: 8 -> 0` | 250 ms, `EASE_OUT`. Purpose: preventing a jarring change |
| `SuccessPanel` (funded / uploaded / applied / saved) | rare | `scale: 0.96 -> 1` + fade, spring, plus one success haptic | `withSpring({ duration: 400, dampingRatio: 0.8 })`. Never `scale(0)`. Purpose: delight (the rare tier) |
| Upload progress fill | continuous | Animated `width` on an absolutely positioned child | `linear`. This is the documented layout-animation exception: out of flow, no children, keeps the corner radius `scaleX` would smear |
| Chat message arrival | tens/day | `FadeIn` only | 150 ms |
| Pull to refresh | — | `RefreshControl` | `tintColor: colors.primary`. Do not hand-roll |
| Skeleton pulse | — | Reanimated CSS animation, opacity keyframes | 1000 ms loop. Skipped under reduced motion |

Non-negotiables:

- **Reanimated 4 + worklets only.** Core `Animated` is not acceptable.
- **Only `transform` and `opacity`** are animated, with the one documented `width` exception above.
- **`.get()` / `.set()`**, never `.value`. Never read or write a shared value during render.
- **`scheduleOnRN`** (not the deprecated `runOnJS`) and only in `onEnd` or a threshold `useAnimatedReaction`, never in `onUpdate`.
- **Never `scale(0)`** — entrances start at 0.95–0.97.
- **`useReducedMotion()` ships with each animation**, not as a follow-up (REQ-009). Under reduced motion: entrances become opacity-only, the success spring becomes a fade, press feedback is unchanged.
- **Feel is judged on a release build on the slowest supported Android device.** Simulator smoothness does not count.

Explicitly **not** built in this plan: hand-rolled bottom sheets (use native-stack `presentation: 'formSheet'` if one is ever needed), shared-element transitions, Lottie, Skia, parallax headers, animated tab indicators.

---

#### **Process** (runtime, QA, deployment)

- **Runtime considerations**: Two extra font families add roughly 400–600 KB to the bundle. Register them with the `expo-font` config plugin (build-time embedding) rather than runtime `loadAsync` if the native stack header title fails to pick up the family on Android; runtime loading is the simpler first attempt and is what TASK-P1-005 specifies.
- **Deployment impact**: New native dependencies (`react-native-reanimated`, `react-native-worklets`, `expo-haptics`, `@expo/vector-icons`) mean the existing Expo Go / dev-client build is no longer sufficient. A new development build is required before Wave 1 can be tested on device. `.github/` CI must run `pnpm --filter mobile typecheck lint test` unchanged; no new CI step is required.
- **Rollback**: each wave is a self-contained commit. Reverting Wave N leaves Waves 0..N-1 working, because every wave's screens compile against the same primitive API.

---

# Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| RISK-001 | **Font licensing.** Haas Grotesk / Haas Groot Disp are Airtable's licensed faces and must not ship. | ~~High~~ **Low** (Q1 resolved 2026-09-02) | High | Closed by DES-P1-002 plus the user's approval of Inter (OFL) + IBM Plex Sans Arabic (OFL). TASK-P1-058 bundles both OFL notices. No Haas file ever enters the repo. |
| RISK-002 | **Inter has no Arabic coverage**, and the primary locale is Arabic. | High (certain) | High | DES-P1-003 pairs IBM Plex Sans Arabic. TASK-P1-014 verifies glyph coverage against every string in `ar.json` before Wave 1. |
| RISK-003 | **`DESIGN.md`'s type scale and 96px rhythm do not fit a phone.** Applying it literally produces two-word headlines and one-band screens. | High | Med | DES-P1-005 and DES-P1-006 down-step the scale and remap the rhythm, documented as deviations in the `DESIGN.md` addendum (TASK-P1-002). |
| RISK-004 | **Brand derivativeness.** Coral `#aa2d00`, forest `#0a2e0e` and cream `#f5e9d4` are Airtable's literal brand hexes. Shipping them makes UGCX visually a clone, and it is not clear they read correctly for an Egyptian / MENA audience. | Med | Med | Accepted for this pass (Q2 resolved 2026-09-02). Token names are semantic (`signatureCoral`, not `airtableCoral`), so a hue shift is a one-file edit later. The mitigation is scheduled, not open: FOLLOW-UP-001 runs a hue-shift review after the first round of Egyptian user testing. |
| RISK-005 | **Cultural read of the palette.** Deep green with white type carries religious and national connotations in parts of MENA; the near-black + white + oxide-red trio sits close to the Egyptian flag palette. Neither is a defect, but neither was chosen deliberately. | Med | Low | FOLLOW-UP-003: a native Egyptian Arabic speaker reviews the forest success state and the coral review card in context before Phase 1 launch. Cheap to change then, expensive to discover after launch. |
| RISK-006 | **`DESIGN.md` contrast gaps.** `hairline` input borders fail WCAG 1.4.11; `opacity: 0.5` disabled buttons fail AA. | High (certain) | Med | DES-P1-007 and DES-P1-009. Re-verify the full contrast table with a checker at the Wave 6 gate, not just from the values in this document. |
| RISK-007 | **Scope creep into behavior.** A visual refactor that touches 26 files is the easiest place to accidentally change escrow, upload ordering, or the `SEC-002` payout boundary. | Med | High | SEC-001 forbids it. Every screen task names the behavior to preserve. Review each wave's diff for changes outside `StyleSheet`, JSX structure, and imports. Run `pnpm --filter mobile test` per wave. |
| RISK-008 | **Test breakage** from the `Text` -> `AppText` swap and the `Screen` wrapper. | Med | Low | ASM-P1-001. Wave 1 deliberately includes `LoginScreen`, which has 3 test files, as the canary. |
| RISK-009 | **New native dependencies break the existing build** (Reanimated 4 needs the new architecture; `expo-doctor` may flag versions). | Low | Med | CON-P1-004: `newArchEnabled` is already true. TASK-P1-001 gates on a clean `expo-doctor`. Install only with `npx expo install`. |
| RISK-010 | **Dark mode debt.** Android users with system dark mode see a permanently white app. | High (certain) | Low | Accepted (Q3 resolved 2026-09-02). `userInterfaceStyle: "light"` already pins the behavior, so nothing renders half-dark. Tracked as FOLLOW-UP-002, debt not bug. |
| RISK-011 | **Web export divergence.** `I18nManager.forceRTL` is a layout no-op on `react-native-web`, so the web build will not mirror. | Low | Low | Out of scope. Note it in `apps/mobile/AGENTS.md`. The web export is not a shipping target in Phase 1. |
| RISK-012 | **`DESIGN.md` becomes stale** as the mobile system diverges from it. | Med | Med | TASK-P1-002 adds the addendum inside `DESIGN.md` itself, so there is one document, not two. |

## Resolved Decisions

All five questions were answered by the user on 2026-09-02 ("do the recommendation"). Nothing in this plan is blocked on a further answer. Do not reopen these during implementation. Raise a new decision row instead.

| # | Question | **Decision (2026-09-02)** | Consequence in this plan |
|---|---|---|---|
| Q1 | Inter + IBM Plex Sans Arabic as the shipping typefaces. Haas cannot ship, and `DESIGN.md` itself names Inter as the substitute. | **Approved.** Both are OFL and free to embed. | DES-P1-002 and DES-P1-003 are confirmed, not provisional. TASK-P1-058 bundles both OFL license texts. RISK-001 drops to Low likelihood. |
| Q2 | Ship Airtable's literal coral / forest / cream hexes, or shift the hues now? | **Ship the literal hexes in this port.** Schedule a hue-shift review after the first round of Egyptian user testing. | The token values in "Schemas" are final for this plan. Token *names* stay semantic (`signatureCoral`), so the later shift is a one-file edit. Tracked as FOLLOW-UP-001. |
| Q3 | Dark mode in scope now, or deferred? | **Deferred.** `DESIGN.md` defines no dark pairing for any of its eight signature surfaces, so inventing one now would ship untested. | DES-P1-013 and CON-002 stand. `app.json` keeps `userInterfaceStyle: "light"`. Tracked as FOLLOW-UP-002. |
| Q4 | Split Waves 4–6 into separate plan files? | **Keep one file.** The waves share one primitive API, and splitting would let the token layer land with no screen proving it. | This document stays the single plan for the whole port. Revisit only if a wave slips past a sprint boundary. |
| Q5 | A design review checkpoint after Wave 1, before the other 17 screens are touched? | **Yes.** Wave 1 is deliberately one screen so the whole visual direction can be rejected cheaply. | TASK-P1-059 adds a hard stop at the end of Wave 1. Waves 2–6 do not start until it passes. |

## Follow-ups (out of scope for this plan, track separately)

| ID | Item | Trigger | Action when triggered |
|----|------|---------|-----------------------|
| FOLLOW-UP-001 | UGCX hue shift away from Airtable's literal coral / forest / cream. | After the first round of Egyptian user testing on the Phase 1 build. | Edit the seven `signature*` values in `src/theme/tokens.ts` and re-run the contrast table. No component or screen change. |
| FOLLOW-UP-002 | Dark theme. | When `DESIGN.md` gains a dark pairing for each signature surface, or when user feedback demands it. | Convert the flat token exports into `lightTheme` / `darkTheme` objects behind a provider. Roughly one wave of work. |
| FOLLOW-UP-003 | Native Egyptian Arabic speaker reviews the forest success state and the coral review card in context (RISK-005). | Before Phase 1 public launch. | Cheap to change then, expensive to discover after launch. |

---

# Code Guidelines

## Clean code (from the `clean-code` skill)

- **One reason to change per file.** `tokens.ts` holds values, `typography.ts` holds the scale, `fonts.ts` holds family resolution, `elevation.ts` holds platform shadows. Do not merge them back into one file.
- **Name by role, not by appearance.** `colors.signatureCoral`, not `colors.orangeRed`. `colors.inputBorder`, not `colors.gray3`. A later hue change must not make a name lie.
- **No magic values below the token layer.** A screen containing `16` or `'#fff'` is a defect, enforced by lint (PAT-001).
- **Functional components and hooks.** `ErrorBoundary` stays the one documented class-component exception.
- **Composition over configuration.** `Card tone="forest"` beats a `SignatureForestCard` subclass; `SuccessPanel` composes `Card` rather than reimplementing it.
- **Typed props, no `any`.** `variant`, `color`, `tone` and `domain` are string-literal unions so an invalid value is a compile error, not a runtime fallback.
- **Small, purpose-specific components.** If a primitive grows past roughly 120 lines, split the variant out.
- **Delete, do not comment out.** The old token values are in git history.
- **Comments explain why, not what.** Every invented token carries a one-line `// invented:` rationale. Every deviation from `DESIGN.md` carries a `// deviates from DESIGN.md because ...` line.

## Security (from the `security` skill)

- **No behavior change during a restyle** (SEC-001). Auth guards, role branching in `RootNavigator`, token storage in `expo-secure-store`, and Paymob webhook-driven status checks stay byte-identical.
- **Preserve the `SEC-002` boundary**: no payout field renders on any brand-facing screen. `CreatorProfileScreen` links to payout details, it does not display them.
- **Preserve the `funded`-only success guard** in `AcceptProposalScreen`. Restyling the success branch must not widen the condition to any non-`pending_payment` status.
- **No secrets or absolute paths in code or comments.** Font URLs are package imports, not remote fetches.
- **No new network calls.** This plan adds no request, no analytics, and no remote asset load. Fonts are bundled.
- **Do not weaken error handling for aesthetics.** `parseApiError` output still reaches the user; a prettier `ErrorState` must still show the parsed message and keep `accessibilityRole="alert"`.

## Frontend patterns (from the `frontend-patterns` and `react-patterns` skills)

- **Container / presentation split**: TanStack Query hooks stay in `hooks/api/`; primitives are pure and take props only. No primitive calls a hook from `hooks/api/`.
- **Derive, do not duplicate.** `statusTone()` derives from `(domain, status)`; do not store a color on a data object.
- **One state machine per screen.** `DeliverableUploadScreen`'s `Phase` union and `AcceptProposalScreen`'s status branching stay as they are; the restyle only changes what each branch renders.
- **Lists**: keep `keyExtractor`, add `RefreshControl`, do not add `getItemLayout` speculatively at Phase 1 data volumes.
- **Accessibility is part of the component, not a follow-up.** Every interactive primitive ships `accessibilityRole`, `accessibilityState`, and a label. EDGE-P1-008 checks nothing was dropped.
- **Never read layout direction inside render logic to build two component trees.** Read `I18nManager.isRTL` only for icon flips and the wizard's `translateX` sign.

---

# Verification Summary

Per wave, all of the following must pass before the next wave starts:

```
1. pnpm --filter mobile typecheck          -> 0 errors
2. pnpm --filter mobile lint               -> 0 errors, 0 warnings
3. pnpm --filter mobile test               -> all suites pass
4. Screenshots: every screen touched, en + ar, iOS + Android          (4 images/screen)
5. Font scale 200% on one touched screen   -> no clipping, 44pt targets intact
6. grep for hex / fontSize / physical direction outside src/theme/    -> 0 matches
7. Release build on the slowest supported Android device: press feedback
   and any wave animation hold frame rate                             (waves 1, 5, 6)
8. Contrast re-check with a checker for every token pair changed      (waves 0, 6)
9. Wave 1 only: TASK-P1-059 design review returns accept             (hard stop)
```

The Iron Law applies: no wave is "done" until the commands above have been run in the session that claims it, and their output read.

Wave gating:

```
  W0 ──▶ W1 ──▶ [TASK-P1-059 review] ──accept──▶ W2 ──▶ W3 ──▶ W4 ──▶ W5 ──▶ W6
                          │
                        reject
                          │
                          └──▶ revise primitives, re-run W1. Cost: one screen.
```
