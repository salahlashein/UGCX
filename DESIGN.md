```yaml
name: "UGCX C3 Sage Design System"
description: "Unified mobile design system for Brand and Creator views on the C3 Sage palette."

colors:
  primary: "#2f5d46"
  primary-active: "#244a37"
  accent-soft: "#e1ebe4"
  canvas: "#eff2ed"
  surface: "#ffffff"
  surface-soft: "#f6f8f5"
  surface-strong: "#e1e7e2"
  surface-dark: "#17241c"
  surface-dark-elevated: "#1f3027"
  hairline: "#dde3de"
  ink: "#17241c"
  body: "#2c3a31"
  muted: "#5d6b62"
  border-strong: "#93a097"
  input-border: "#7f8c83"
  on-primary: "#ffffff"
  on-dark: "#ffffff"
  danger: "#b3261e"
  danger-surface: "#fdecea"
  success: "#006400"
  info: "#254fad"

typography:
  metric:
    fontFamily: Inter / IBM Plex Sans Arabic
    fontSize: 38px
    lineHeight: 46px
    fontWeight: 500
  displayLg:
    fontFamily: Inter / IBM Plex Sans Arabic
    fontSize: 32px
    lineHeight: 38px
    fontWeight: 400
  displayMd:
    fontFamily: Inter / IBM Plex Sans Arabic
    fontSize: 28px
    lineHeight: 34px
    fontWeight: 400
  titleLg:
    fontFamily: Inter / IBM Plex Sans Arabic
    fontSize: 22px
    lineHeight: 30px
    fontWeight: 400
  titleMd:
    fontFamily: Inter / IBM Plex Sans Arabic
    fontSize: 20px
    lineHeight: 28px
    fontWeight: 400
  titleSm:
    fontFamily: Inter / IBM Plex Sans Arabic
    fontSize: 17px
    lineHeight: 24px
    fontWeight: 500
  label:
    fontFamily: Inter / IBM Plex Sans Arabic
    fontSize: 16px
    lineHeight: 22px
    fontWeight: 500
  button:
    fontFamily: Inter / IBM Plex Sans Arabic
    fontSize: 16px
    lineHeight: 22px
    fontWeight: 500
  body:
    fontFamily: Inter / IBM Plex Sans Arabic
    fontSize: 15px
    lineHeight: 22px
    fontWeight: 400
  bodySm:
    fontFamily: Inter / IBM Plex Sans Arabic
    fontSize: 13px
    lineHeight: 19px
    fontWeight: 400
  caption:
    fontFamily: Inter / IBM Plex Sans Arabic
    fontSize: 13px
    lineHeight: 18px
    fontWeight: 500
  overline:
    fontFamily: Inter / IBM Plex Sans Arabic
    fontSize: 11px
    lineHeight: 14px
    fontWeight: 500

rounded:
  xs: 2px
  sm: 6px
  md: 10px
  lg: 12px
  xl: 18px
  xxl: 22px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px
```

# Design System: UGCX C3 Sage (Brand & Creator Unified Theme)

## 1. Visual Theme & Atmosphere
The Brand C3 Sage theme is the single design system for both Brand and Creator views. Every screen uses a warm tinted sage page background (`colors.canvas` `#eff2ed`) with elevated white surface cards (`colors.surface` `#ffffff`), deep forest sage primary actions (`colors.primary` `#2f5d46`), and soft sage icon tiles (`colors.accentSoft` `#e1ebe4`).

All theme tokens live in `apps/mobile/src/theme/tokens.ts`, `apps/mobile/src/theme/typography.ts`, `apps/mobile/src/theme/fonts.ts`, and `apps/mobile/src/theme/elevation.ts`. Never hardcode hex values, font sizes, or raw shadows in screen files.

## 2. Color Palette & Roles (`apps/mobile/src/theme/tokens.ts`)

### Brand & Accent
- **Primary (`colors.primary` `#2f5d46`):** Primary buttons, active filter chips, primary quick-action tiles, brand/creator avatars, and links.
- **Primary Active (`colors.primaryActive` `#244a37`):** Pressed state for primary buttons.
- **Accent Soft (`colors.accentSoft` `#e1ebe4`):** Rounded icon tiles (`30x30` or `40x40` with `radius.md`), active tab pill inside `FloatingTabBar`, and subtle badge backgrounds.

### Surfaces
- **Canvas (`colors.canvas` `#eff2ed`):** Default screen background for every Brand and Creator screen.
- **Surface (`colors.surface` `#ffffff`):** Default card background (`<Card />` and `<PressableCard />`), form inputs, icon buttons, and bottom sheets.
- **Surface Soft (`colors.surfaceSoft` `#f6f8f5`):** Row press highlight and disabled input background.
- **Surface Strong (`colors.surfaceStrong` `#e1e7e2`):** Segmented control track, skeleton placeholders, neutral status pills, and disabled button fill.
- **Surface Dark (`colors.surfaceDark` `#17241c`):** Floating bottom tab bar (`FloatingTabBar`) and dark `<SignatureCard variant="dark" />` summary cards.
- **Hairline (`colors.hairline` `#dde3de`):** `StyleSheet.hairlineWidth` row dividers inside grouped white cards. Never use `hairline` as a standalone card border on `canvas`.

### Text & Borders
- **Ink (`colors.ink` `#17241c`):** Headlines, card titles, primary values, and active labels.
- **Body (`colors.body` `#2c3a31`):** Running body copy and form labels.
- **Muted (`colors.muted` `#5d6b62`):** Secondary metadata, subtitles, section overlines, and timestamps.
- **Border Strong (`colors.borderStrong` `#93a097`):** Unselected tab icons, trailing chevrons, and disabled button labels.
- **Input Border (`colors.inputBorder` `#7f8c83`):** Form input outlines and unselected filter chip outlines (passes WCAG 1.4.11 3:1 contrast).
- **On Primary / On Dark (`colors.onPrimary` `#ffffff`):** Text and icons on `colors.primary` and `colors.surfaceDark`.

### Semantic & Signature Tones
- **Success (`colors.success` `#006400`):** Positive ledger amounts, completed states, and verification checks.
- **Danger (`colors.danger` `#b3261e`) & Danger Surface (`colors.dangerSurface` `#fdecea`):** Validation errors, upload failures, destructive actions, and danger icon tiles.
- **Signature Pastels (`signatureMint`, `signatureYellow`, `signaturePeach`, `signatureMustard`, `signatureForest`, `signatureCoral`, `signatureCream`):** Used by `<StatusBadge />` and `<Card tone="..." />` when semantic status differentiation is required.

## 3. Typography Rules (`apps/mobile/src/theme/typography.ts` & `AppText`)
- **Font Families (`apps/mobile/src/theme/fonts.ts`):** `Inter` for Latin text and `IBM Plex Sans Arabic` for Arabic text.
- **Allowed Weights:** `400` and `500` only. Never use `fontWeight: '600'` or `'700'`. Visual hierarchy comes from size, color contrast, and card surfaces.
- **Arabic Line Height:** `AppText` automatically multiplies `lineHeight` by `1.15` when RTL/Arabic is active.
- **Tabular Figures:** Always add `fontVariant: ['tabular-nums']` to money amounts, counts, and badge numbers.
- **Role Scale (consume via `<AppText variant="..." color="...">`):**
  - `metric` (38/46, weight 500): Hero money figures (monthly spend, withdrawable balance, escrow total).
  - `displayLg` (32/38, weight 400): Large dark summary card figures.
  - `displayMd` (28/34, weight 400): Top-level screen titles and bottom sheet headers.
  - `titleLg` (22/30, weight 400): Major section titles.
  - `titleMd` (20/28, weight 400): Identity card names and sub-headers.
  - `titleSm` (17/24, weight 500): Section headers (`Active briefs`, `Work board`), stat values, and card titles.
  - `label` (16/22, weight 500): List row primary titles, chip text, and inline emphasis.
  - `button` (16/22, weight 500): Button labels.
  - `body` (15/22, weight 400): Default paragraph text and settings row labels.
  - `bodySm` (13/19, weight 400): Secondary row metadata, greetings, and quick-action labels.
  - `caption` (13/18, weight 500): Input labels, timestamps, and small metadata.
  - `overline` (11/14, weight 500, letterSpacing 0.8): Group headers, status badges, and count badges.

## 4. Reusable UI Components (`apps/mobile/src/components/ui/`)
Every new Brand or Creator screen must compose these shared components instead of raw React Native primitives:

- **`<AppText variant="..." color="...">` (`Text.tsx`):** Required for all text rendering. Resolves locale font family and Arabic line height automatically.
- **`<Card>` & `<PressableCard>` (`Card.tsx`):** Default `tone="canvas"` renders a white `colors.surface` container with `radius.xl` (18px), `spacing.md` (16px) padding, and `elevation.soft` shadow. `<PressableCard>` adds a `scale(0.97)` Reanimated press transition.
- **`<SignatureCard variant="dark" | "coral" | "forest" | "cream">` (`SignatureCard.tsx`):** Full-bleed accent card for ledger totals or high-priority callouts.
- **`<Button>` (`Button.tsx`):** Supports `variant="primary" | "secondary" | "secondaryOnDark" | "ghost" | "danger"`, `loading`, `disabled`, and `icon`. Uses `radius.lg` (12px) and `sizes.buttonHeight` (48px).
- **`<TextInput>` (`TextInput.tsx`):** Standard text field with `label`, `error`, `hint`, `colors.surface` background, `colors.inputBorder` outline, and 2px `colors.primary` focus border.
- **`<FilterChip>` (`FilterChip.tsx`):** Pill-shaped filter button (`colors.surface` unselected, `colors.primary` selected).
- **`<StatusBadge domain="campaign" | "proposal" | "collaboration" | "deliverable" status="..." />` (`StatusBadge.tsx`):** Canonical pill badge for all domain statuses.
- **`<Icon>` (`Icon.tsx`):** Feather icon wrapper bound to theme color roles and `directional` RTL mirroring.
- **`<LoadingState>`, `<ErrorState>`, `<EmptyState>`, `<QueryStateView>`:** Standard async state views. Never render a bare `<ActivityIndicator>` without `<LoadingState>` or a centered container.
- **`<AppBottomSheet>` (`BottomSheet.tsx`):** Standard modal sheet for proposals, payouts, and filters.
- **`<FloatingTabBar>` (`navigation/FloatingTabBar.tsx`):** Floating `colors.surfaceDark` pill bar shared by `BrandTabNavigator` and `CreatorTabNavigator`.

## 5. Standard Screen Layouts (Brand & Creator Parity)

### A. Dashboard / Home Screen (`BrandDashboardScreen` & `CreatorHomeScreen`)
- **Container:** `SafeAreaView` with `edges={['top']}` and `backgroundColor: colors.canvas`. `ScrollView` with `paddingHorizontal: spacing.md`, `gap: spacing.md`.
- **Header Row:** `44x44` rounded avatar/logo tile (`borderRadius: 14`, `backgroundColor: colors.primary`, white initials in `AppText variant="label"`), middle column with greeting/location (`bodySm` `muted`) and display name (`titleSm` `ink`), trailing `44x44` white notification bell button (`borderRadius: 14`, `colors.surface`, `elevation.soft`).
- **Hero Metric / Summary Card:** White `<Card>` with `borderRadius: radius.xxl` (22px), centered `paddingVertical: spacing.lg`, label in `bodySm` `muted`, figure in `metric` `ink` with `tabular-nums`, and a bottom meta row with a `14px` primary `<Icon>` + `bodySm` `muted` text.
- **Quick Actions Row:** 4 `<PressableCard>` tiles (`56x56`, `borderRadius: radius.xl`), primary tile in `colors.primary`, secondary tiles in `colors.surface`, with optional top-end pill count badge.
- **Grouped List Card:** `<Card style={{ padding: 0 }}>` containing pressable rows separated by `StyleSheet.hairlineWidth` (`colors.hairline`), each row leading with a `40x40` `colors.accentSoft` icon tile (`borderRadius: radius.md`), middle `label` + `bodySm` text, and trailing `<StatusBadge />` or chevron.

### B. Profile & Settings Screen (`BrandProfileScreen` & `CreatorProfileScreen`)
- **Identity Card:** White `<Card>` with `borderRadius: radius.xxl`, centered `64x64` avatar (`borderRadius: 20`, `colors.primary`), name row with verified icon (`check-circle`), subtitle (`bodySm` `muted`), pill outline Edit button (`borderRadius: radius.pill`, `borderColor: colors.hairline`), and a 3-column bottom stats strip separated by hairline borders.
- **Grouped Settings Sections:** Section overline (`variant="overline" color="muted"`) above a `<Card style={{ padding: 0 }}>`. Each row (`minHeight: 52`, `paddingHorizontal: spacing.md`) has a `30x30` `colors.accentSoft` icon tile (`borderRadius: radius.md`), `body` label, optional `bodySm` `muted` value, and a directional `chevron-right` icon.

### C. Discovery & List Screens (`MyBriefsScreen`, `CampaignDiscoveryScreen`, `MyProposalsScreen`)
- **Header:** Screen title (`displayMd` or `titleLg` in `ink`) + optional action button.
- **Filter Bar:** Horizontal row of `<FilterChip />` components.
- **Cards:** White `<Card>` or `<PressableCard>` items on `colors.canvas` with `<StatusBadge />` pills and `colors.accentSoft` icon tiles or media thumbnails (`borderRadius: radius.md`).

### D. Money & Ledger Screens (`BrandBillingScreen` & `PayoutsScreen`)
- **Hero Balance Card:** White hero `<Card style={{ borderRadius: radius.xxl }}>` or `<SignatureCard variant="dark">` with `overline` kicker, `metric` or `displayLg` balance with `tabular-nums`, and primary `<Button>` CTA.
- **Ledger Container:** Grouped white `<Card style={{ padding: 0 }}>` with hairline-divided rows, `label` title, `caption` `muted` metadata, and right-aligned tabular amount + status.

## 6. RTL & Localization Rules
1. Never use physical directional styles (`marginLeft`, `marginRight`, `paddingLeft`, `paddingRight`, `left`, `right`, `borderLeft*`, `borderRight*`). Always use logical properties (`marginStart`, `marginEnd`, `paddingStart`, `paddingEnd`, `start`, `end`, `borderStart*`, `borderEnd*`).
2. Never set `textAlign: 'left'` or `'right'`. Let React Native follow the locale reading direction, or use `'center'`.
3. Never use `flexDirection: 'row-reverse'`. Standard `flexDirection: 'row'` mirrors automatically under RTL.
4. Pass `directional` to `<Icon>` for arrows, chevrons, and log-out icons so they mirror in Arabic.
5. Run `npm --prefix apps/mobile run lint:rtl` to verify zero physical-direction regressions.

## 7. Web Responsive Shell & C3 Sage CSS Mapping (`apps/web`)
1. **CSS Custom Properties (`apps/web/src/app/globals.css`):** Expose all C3 Sage tokens as CSS variables (`--color-canvas: #eff2ed`, `--color-surface: #ffffff`, `--color-primary: #2f5d46`, `--color-primary-active: #244a37`, `--color-accent-soft: #e1ebe4`, `--color-surface-dark: #17241c`, `--color-hairline: #dde3de`, `--color-ink: #17241c`, `--color-body: #2c3a31`, `--color-muted: #5d6b62`) and TypeScript tokens (`apps/web/src/theme/tokens.ts`).
2. **Responsive AppShell (`apps/web/src/components/layout/AppShell.tsx`):**
   - **Desktop (`>= 768px`):** Fixed 260px left/inline-start navigation sidebar (`colors.surface` `#ffffff` or `colors.surfaceDark` `#17241c`) with active `colors.accentSoft` (`#e1ebe4`) and `colors.primary` (`#2f5d46`) pill items, paired with a centered max-width `1200px` multi-column content canvas (`#eff2ed`).
   - **Mobile Web (`< 768px`):** Full-bleed `#eff2ed` canvas with the floating dark pill tab bar (`#17241c` `FloatingTabBar`) pinned to the bottom viewport edge.
3. **Web Typography & Logical RTL:** Load `Inter` and `IBM Plex Sans Arabic` with weights `400` and `500` only via `next/font/google`. Toggle `<html lang="en|ar" dir="ltr|rtl">` dynamically and use logical CSS properties (`margin-inline-start`, `padding-inline-start`, `text-align: start`, Tailwind `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`).

### 7.4 Ledger Mono Web Finish (`operations/specs/web_ledger_mono/`)
1. **Web-only Scope:** Ledger Mono applies strictly to `apps/web`. Mobile `apps/mobile` retains original C3 Sage radii (`radius.xl` 18px).
2. **Radius Scale (Web):**
   - Card: 14px (`radius.card`)
   - Hero Card: 16px (`radius.hero`)
   - Button / Input: 10px (`radius.button`)
   - Chip / Filter: 8px (`radius.chip`)
   - Badge / Tag: 4px (`radius.badge`)
   - XL: 18px (`radius.xl` retained for parity)
3. **Typography & Mono Roles (Weights 400 and 500 only):**
   - JetBrains Mono loaded via Google Fonts for numbers, references, overlines, badges, and table headers.
   - Roles: `metricMono` (38/46), `metricMd` (28/34), `metricSm` (22/28), `overlineMono` (11/14), `badgeMono` (10/14), `tableHead` (10.5/14), `numeric` (15/22).
4. **Surfaces & Rules:**
   - Dashed line: `1px dashed #b9c4bc` (`--dash-line`, `colors.dashLine`).
   - Hero grid paper: `background: var(--paper)` (graph lines with dark surface).
5. **Arabic RTL Protection:**
   - `:lang(ar) .mono-caps, :lang(ar) [data-mono-caps] { letter-spacing: 0; text-transform: none; }` prevents Arabic letter dissociation.
   - Numbers and currency maintain LTR formatting (`dir="ltr"`).


