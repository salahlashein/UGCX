/**
 * TASK-P1-006: platform shadow pair. `raised` is the only shadow in the
 * app (elevation philosophy is color-block first, shadow second, per
 * DESIGN.md's "Elevation & Depth" section). `shadowOffset.width` is
 * always 0, so this needs no RTL mirroring (R5).
 */

import { Platform } from 'react-native';
import { colors } from './tokens';

export const elevation = {
  none: {},
  raised: Platform.select({
    ios: {
      shadowColor: colors.ink,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    android: {
      elevation: 3,
    },
    default: {},
  }),
  // Soft, diffused shadow for white cards on the sage canvas.
  soft: Platform.select({
    ios: {
      shadowColor: colors.surfaceDark,
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
    },
    android: {
      elevation: 2,
      shadowColor: colors.surfaceDark,
    },
    default: {},
  }),
} as const;
