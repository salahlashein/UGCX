import type { ComponentProps } from 'react';
import { I18nManager } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';

type ColorRole = keyof typeof colors;
export type IconName = ComponentProps<typeof Feather>['name'];

interface Props {
  name: IconName;
  size?: number;
  color?: ColorRole;
  /**
   * R4: set true for chevron-*, arrow-*, send, corner-* so the glyph
   * flips under Arabic RTL. Icons with no inherent direction (search,
   * user, check, alert-triangle) must leave this false.
   */
  directional?: boolean;
}

/**
 * TASK-P1-010: the app's only icon primitive. Wraps Feather from
 * @expo/vector-icons; do not mix icon families elsewhere.
 */
export function Icon({ name, size = 20, color = 'ink', directional = false }: Props) {
  const shouldFlip = directional && I18nManager.isRTL;
  return (
    <Feather
      name={name}
      size={size}
      color={colors[color]}
      style={shouldFlip ? { transform: [{ scaleX: -1 }] } : undefined}
    />
  );
}
