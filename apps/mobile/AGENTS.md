# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# App shape

- Expo SDK 57, React Native 0.86, new architecture on. TypeScript.
- Navigation is **React Navigation v7** (`src/navigation/`), not `expo-router`. Do not use `expo-router` APIs (`NativeTabs`, `Link.Preview`, file routing).
- Server state: TanStack Query hooks in `src/hooks/api/`. Auth session: Zustand in `src/store/`.
- Arabic is the **primary** locale. English is secondary. Full RTL is a hard requirement (`HLD.md` REQ/GUD-001). Every screen must render correctly in both.
- Roles: `brand` and `creator`. `src/navigation/RootNavigator.tsx` is the only place `user.role` selects a screen set.

# Design system

Source of truth: `DESIGN.md` at the repo root. Read it before any UI work.

Port plan: `operations/specs/design_mobile_design_system_port/plan_phase_1.md`.
**Status: Planned, not yet implemented.** The rules below become binding as each wave of that plan lands. Until then, `src/theme/tokens.ts` holds the provisional neutral set.

Decided on 2026-09-02, do not reopen (see the plan's "Resolved Decisions"):

- Type is **Inter** (Latin) and **IBM Plex Sans Arabic** (Arabic), weights 400 and 500 only. Haas is Airtable's licensed face and must never enter this repo.
- The signature surface hexes are Airtable's literal values for this pass. A UGCX hue shift is scheduled as FOLLOW-UP-001 and is a one-file edit, because the token names are semantic.
- Dark mode is deferred (FOLLOW-UP-002).
- Wave 1 ends in a design review hard stop. Waves 2 to 6 do not start until it returns accept.

Once the port lands:

- Import tokens from `src/theme` only. A screen or component file must not contain a hex literal, a `fontSize`, a `fontFamily`, or a `shadow*`/`elevation` declaration.
- Render text with `src/components/ui/Text.tsx` (`AppText`), never `Text` from `react-native`. It resolves the font family per locale and applies the Arabic line-height multiplier.
- Never write `marginLeft/Right`, `paddingLeft/Right`, `left`/`right`, `borderLeft*/Right*`, or `textAlign: 'left'|'right'`. Use the direction-aware equivalents. ESLint rejects the physical forms.
- Icons come from `src/components/ui/Icon.tsx`. Set `directional` on chevrons, arrows, and send icons so they flip in RTL.
- Animation: `react-native-reanimated` 4 only, never core `Animated`. Animate `transform` and `opacity` only. Tab switches and stack transitions never get custom motion. Every animation ships with a `useReducedMotion()` branch.
- Money and counts go through `src/utils/format.ts` so Arabic renders Latin digits.

# Known limits

- Dark mode is deliberately out of scope. `app.json` pins `userInterfaceStyle: "light"`.
- `I18nManager.forceRTL` is a layout no-op on `react-native-web`, so the web export does not mirror. The web export is not a Phase 1 shipping target.
