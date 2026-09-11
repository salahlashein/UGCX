/**
 * DES-P1-001: this file previously carried a header explaining why
 * DESIGN.md was deliberately NOT applied here (no mobile specs, no RTL
 * guidance). The user explicitly overrode that decision on 2026-09-02
 * (`operations/specs/design_mobile_design_system_port/plan_phase_1.md`).
 * Both blockers are resolved by that plan, not ignored: the "Mobile & RTL
 * Addendum" section of DESIGN.md now covers the mobile type scale, spacing
 * mapping, and RTL rules this file and its siblings (`typography.ts`,
 * `fonts.ts`, `elevation.ts`) implement. Every value below is DESIGN.md's,
 * except where marked `// invented:` with a one-line rationale.
 */

import { StyleSheet } from 'react-native';

export const colors = {
  // Brand & accent
  primary: '#181d26',
  primaryActive: '#0d1218',

  // Surfaces
  canvas: '#ffffff',
  surfaceSoft: '#f8fafc',
  surfaceStrong: '#e0e2e6',
  surfaceDark: '#181d26',
  surfaceDarkElevated: '#1d1f25',
  hairline: '#dddddd', // decorative dividers + card outlines ONLY

  // Text
  ink: '#181d26',
  body: '#333840',
  muted: '#41454d', // note: darker than the old #6b7280 (9.4:1 vs 4.8:1)
  borderStrong: '#9297a0',
  onPrimary: '#ffffff',
  onDark: '#ffffff',

  // Signature card surfaces (brand voltage; full-bleed surfaces, never small accents)
  signatureCoral: '#aa2d00',
  signatureForest: '#0a2e0e',
  signatureCream: '#f5e9d4',
  signaturePeach: '#fcab79',
  signatureMint: '#a8d8c4',
  signatureYellow: '#f4d35e',
  signatureMustard: '#d9a441',

  // Semantic
  link: '#1b61c9',
  linkActive: '#1a3866',
  info: '#254fad',
  infoBorder: '#458fff',
  success: '#006400',
  successBorder: '#39bf45',

  // invented: DESIGN.md has no error color. Coral is a brand surface, not an error tone. (DES-P1-008)
  danger: '#b3261e',
  dangerSurface: '#fdecea',
  // invented: hairline (1.36:1) and borderStrong (2.93:1) both fail WCAG 1.4.11's 3:1
  // for non-text UI that conveys state. This is 3.25:1. (DES-P1-007)
  inputBorder: '#8a8f99',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  // Mobile band rhythm is spacing.xxl (48). spacing.section (96) is reserved for the
  // auth hero's vertical centering only. (DES-P1-006)
  section: 96,
} as const;

export const radius = {
  xs: 2,
  sm: 6,
  md: 10,
  lg: 12,
  // pill/full: chips, filters, badges, avatars, progress tracks. NEVER buttons. (DES-P1-010)
  pill: 9999,
  full: 9999,
} as const;

// invented: DESIGN.md has no mobile sizing scale
export const sizes = {
  touchMin: 44, // WCAG 2.5.8 / Apple HIG minimum
  buttonHeight: 48, // DESIGN.md's own touch-target note says 48
  inputHeight: 48, // raised from DESIGN.md's 44 for thumb accuracy
  iconButton: 44, // raised from DESIGN.md's 40, which is under the WCAG minimum
  tabBarHeight: 56,
  hairlineWidth: StyleSheet.hairlineWidth,
} as const;

// TEMPORARY: removed in Wave 6 (TASK-P1-056, final sweep).
// Wave 1 (TASK-P1-015..028) migrated its own primitives (Button, TextInput,
// ChipSelect, EmptyState, ErrorState) and its one screen (LoginScreen) plus
// ErrorBoundary off this shim and onto `./typography.ts` / AppText. The
// remaining 17 screens (Waves 2-6) still import `typography` from this
// module in its pre-port shape ({ fontSize, fontWeight }) and spread it
// directly into StyleSheet.create objects. The real type scale lives in
// `./typography.ts` as 11 roles shaped { fontSize, lineHeight, letterSpacing,
// weight }, consumed through `AppText`. This shim keeps the remaining call
// sites type-clean until each screen's own wave migrates it to AppText.
export const typography = {
  title: { fontSize: 22, fontWeight: '600' as const },
  subtitle: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
} as const;
