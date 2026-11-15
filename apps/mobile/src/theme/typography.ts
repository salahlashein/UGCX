/**
 * TASK-P1-004: the mobile type scale. `weight` is 400 | 500 only, never a
 * `fontWeight` string, and never 600 (DESIGN.md reserves 600 for legal
 * surfaces, which this app does not have). No `fontFamily` here: family is
 * resolved at render time by `AppText` (DES-P1-004), because
 * StyleSheet.create runs before the locale resolves.
 *
 * Sizes are DESIGN.md's own scale stepped down one level for a phone
 * (DES-P1-005): a 40px desktop hero leaves room for three words on a
 * 390pt-wide screen, and 14px/1.25 body is a desktop reading measure.
 * The desktop token each role maps from is noted per row.
 */

export const typography = {
  metric: { fontSize: 38, lineHeight: 46, letterSpacing: -1, weight: 500 }, // invented: hero money figures
  displayLg: { fontSize: 32, lineHeight: 38, letterSpacing: 0, weight: 400 }, // <- display-lg 40
  displayMd: { fontSize: 28, lineHeight: 34, letterSpacing: 0, weight: 400 }, // <- display-md 32
  titleLg: { fontSize: 22, lineHeight: 30, letterSpacing: 0.12, weight: 400 }, // <- title-lg 24
  titleMd: { fontSize: 20, lineHeight: 28, letterSpacing: 0, weight: 400 }, // <- title-md 20
  titleSm: { fontSize: 17, lineHeight: 24, letterSpacing: 0, weight: 500 }, // <- title-sm 18
  label: { fontSize: 16, lineHeight: 22, letterSpacing: 0, weight: 500 }, // <- label-md 16
  button: { fontSize: 16, lineHeight: 22, letterSpacing: 0, weight: 500 }, // <- typography.button
  body: { fontSize: 15, lineHeight: 22, letterSpacing: 0, weight: 400 }, // <- body-md 14/1.25
  bodySm: { fontSize: 13, lineHeight: 19, letterSpacing: 0, weight: 400 }, // invented
  caption: { fontSize: 13, lineHeight: 18, letterSpacing: 0.16, weight: 500 }, // <- caption 14
  overline: { fontSize: 11, lineHeight: 14, letterSpacing: 0.8, weight: 500 }, // invented: badges, tab labels
} as const;

// Arabic multiplies every lineHeight by 1.15 in AppText (DES-P1-003).
// DESIGN.md's pricing roles (pricing-display 44.8/475, pricing-section 28/475,
// pricing-card-title 20/475) are deliberately absent (DES-P1-002).

export type TypographyRole = keyof typeof typography;
