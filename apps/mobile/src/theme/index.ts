/**
 * TASK-P1-007: single import surface for the theme layer. New code
 * (Wave 1 onward) imports from `'../../theme'`, not from the individual
 * files directly.
 */

// Named, not `export *`: tokens.ts carries a TEMPORARY compat `typography`
// shim (old shape) alongside the new `colors`/`spacing`/`radius`/`sizes`.
// A blind `export *` from both this file and `./typography` would collide
// on the `typography` name and silently drop it. New code gets the real
// 11-role scale from `./typography.ts`.
export { colors, spacing, radius, sizes } from './tokens';
export * from './typography';
export * from './fonts';
export * from './elevation';
