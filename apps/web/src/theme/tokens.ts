/**
 * TASK-W1-003: Brand C3 Sage tokens for apps/web.
 * Exact parity with DESIGN.md and apps/mobile/src/theme/tokens.ts.
 */

export const colors = {
  // Brand & accent
  primary: '#2f5d46',
  primaryActive: '#244a37',
  accentSoft: '#e1ebe4',

  // Surfaces. Warm paper instead of grey-green (visual direction A, UI audit).
  canvas: '#f7f6f2',
  surface: '#ffffff',
  surfaceSoft: '#fbfaf7',
  surfaceStrong: '#ebe8e1',
  surfaceDark: '#17241c',
  surfaceDarkElevated: '#1f3027',
  hairline: '#e3e0d8',

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
  dashLine: '#cfcbc0',
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
  // 4.67:1 on the canvas and 5.27:1 on white (UI audit G4); was #93a097 at 2.7:1.
  textTertiary: '#626f66',
  border: '#e3e0d8',
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
