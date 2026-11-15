/**
 * TASK-W1-003: Brand C3 Sage tokens for apps/web.
 * Exact parity with DESIGN.md and apps/mobile/src/theme/tokens.ts.
 */

export const colors = {
  // Brand & accent
  primary: '#2f5d46',
  primaryActive: '#244a37',
  accentSoft: '#e1ebe4',

  // Surfaces
  canvas: '#eff2ed',
  surface: '#ffffff',
  surfaceSoft: '#f6f8f5',
  surfaceStrong: '#e1e7e2',
  surfaceDark: '#17241c',
  surfaceDarkElevated: '#1f3027',
  hairline: '#dde3de',

  // Text
  ink: '#17241c',
  body: '#2c3a31',
  muted: '#5d6b62',
  borderStrong: '#93a097',
  onPrimary: '#ffffff',
  onDark: '#ffffff',

  // Signature card surfaces
  signatureCoral: '#aa2d00',
  signatureForest: '#0a2e0e',
  signatureCream: '#f5e9d4',
  signaturePeach: '#fcab79',
  signatureMint: '#a8d8c4',
  signatureYellow: '#f4d35e',
  signatureMustard: '#d9a441',

  // Semantic
  link: '#2f5d46',
  linkActive: '#244a37',
  dashLine: '#b9c4bc',
  infoSurface: '#e3ebfb',
  info: '#254fad',
  infoBorder: '#458fff',
  success: '#006400',
  successBorder: '#39bf45',
  danger: '#b3261e',
  dangerSurface: '#fdecea',
  inputBorder: '#7f8c83',

  // Aliases for component parity
  textPrimary: '#17241c',
  textSecondary: '#5d6b62',
  textTertiary: '#93a097',
  border: '#dde3de',
} as const;

export type ColorToken = keyof typeof colors;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 96,
} as const;

export const radius = {
  xs: 2,
  sm: 6,
  md: 10,
  lg: 12,
  xl: 18,
  xxl: 22,
  pill: 9999,
  full: 9999,
  card: 14,
  hero: 16,
  button: 10,
  chip: 8,
  badge: 4,
} as const;

export const sizes = {
  touchMin: 44,
  buttonHeight: 48,
  inputHeight: 48,
  iconButton: 44,
  tabBarHeight: 56,
  sidebarWidth: 260,
} as const;
