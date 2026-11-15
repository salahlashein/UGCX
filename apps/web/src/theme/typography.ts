/**
 * TASK-W1-003: C3 Sage typography scale for web.
 * Only font weights 400 and 500 are allowed (CON-W1-001).
 */

export const typography = {
  metric: { fontSize: 38, lineHeight: 46, letterSpacing: -1, weight: 500 },
  metricMono: { fontSize: 38, lineHeight: 46, letterSpacing: -2, weight: 500, mono: true },
  metricMd: { fontSize: 28, lineHeight: 34, letterSpacing: -1.2, weight: 500, mono: true },
  metricSm: { fontSize: 22, lineHeight: 28, letterSpacing: -0.8, weight: 500, mono: true },
  displayLg: { fontSize: 32, lineHeight: 38, letterSpacing: 0, weight: 400 },
  displayMd: { fontSize: 28, lineHeight: 34, letterSpacing: 0, weight: 400 },
  titleLg: { fontSize: 22, lineHeight: 30, letterSpacing: 0.12, weight: 400 },
  titleMd: { fontSize: 20, lineHeight: 28, letterSpacing: 0, weight: 400 },
  titleSm: { fontSize: 17, lineHeight: 24, letterSpacing: 0, weight: 500 },
  label: { fontSize: 16, lineHeight: 22, letterSpacing: 0, weight: 500 },
  button: { fontSize: 16, lineHeight: 22, letterSpacing: 0, weight: 500 },
  body: { fontSize: 15, lineHeight: 22, letterSpacing: 0, weight: 400 },
  bodySm: { fontSize: 13, lineHeight: 19, letterSpacing: 0, weight: 400 },
  caption: { fontSize: 13, lineHeight: 18, letterSpacing: 0.16, weight: 500 },
  overline: { fontSize: 11, lineHeight: 14, letterSpacing: 0.8, weight: 500 },
  overlineMono: { fontSize: 11, lineHeight: 14, letterSpacing: 0.8, weight: 500, mono: true },
  badgeMono: { fontSize: 10, lineHeight: 14, letterSpacing: 0.6, weight: 500, mono: true },
  tableHead: { fontSize: 10.5, lineHeight: 14, letterSpacing: 0.7, weight: 500, mono: true },
  numeric: { fontSize: 15, lineHeight: 22, letterSpacing: 0, weight: 400, mono: true },
} as const;

export type TypographyRole = keyof typeof typography;
