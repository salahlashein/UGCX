import { useState, type ReactNode } from 'react';
import {
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { colors, radius, spacing } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';

/** TASK-P1-016 / Data Models "Tone". */
export type CardTone =
  | 'canvas'
  | 'soft'
  | 'strong'
  | 'cream'
  | 'coral'
  | 'forest'
  | 'dark'
  | 'peach'
  | 'mint'
  | 'yellow'
  | 'mustard';

type ColorRole = keyof typeof colors;

// coral / forest / dark carry white type; every other tone (including the
// two flat neutrals `soft`/`strong`, which DESIGN.md documents with no
// border of their own) keeps ink type on a light background.
const DARK_TEXT_TONES = new Set<CardTone>(['coral', 'forest', 'dark']);
const LARGE_RADIUS_TONES = new Set<CardTone>(['coral', 'forest', 'dark']);

const TONE_BACKGROUND: Record<CardTone, string> = {
  canvas: colors.surface,
  soft: colors.surfaceSoft,
  strong: colors.surfaceStrong,
  cream: colors.signatureCream,
  coral: colors.signatureCoral,
  forest: colors.signatureForest,
  dark: colors.surfaceDark,
  peach: colors.signaturePeach,
  mint: colors.signatureMint,
  yellow: colors.signatureYellow,
  mustard: colors.signatureMustard,
};

/** DES-P1-016: coral/forest/dark need white type; every other tone stays ink. */
export function cardTextColor(tone: CardTone): ColorRole {
  return DARK_TEXT_TONES.has(tone) ? 'onPrimary' : 'ink';
}

function toneShape(tone: CardTone): ViewStyle {
  if (tone === 'canvas') {
    return {
      backgroundColor: TONE_BACKGROUND.canvas,
      borderRadius: radius.xl,
      padding: spacing.md,
      ...elevation.soft,
    };
  }
  return {
    backgroundColor: TONE_BACKGROUND[tone],
    borderRadius: LARGE_RADIUS_TONES.has(tone) ? radius.lg : radius.md,
    padding: spacing.lg,
  };
}

interface CardProps extends ViewProps {
  tone?: CardTone;
}

export function Card({ tone = 'canvas', style, ...props }: CardProps) {
  return <View style={[toneShape(tone), style]} {...props} />;
}

interface PressableCardProps extends Omit<PressableProps, 'style' | 'children'> {
  tone?: CardTone;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * TASK-P1-016: a Card acting as a link. Press scale matches REQ-007 / the
 * Motion Specification table (`scale(0.97)`, 120ms) — the "(0.98)" in the
 * task's prose is inconsistent with both and is treated as a typo.
 */
export function PressableCard({ tone = 'canvas', style, children, ...props }: PressableCardProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={16}
      {...props}
    >
      <Animated.View style={[toneShape(tone), pressTransition, pressed && pressedStyle, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// Kept outside StyleSheet.create: `transitionProperty`/`transitionDuration`/
// `transitionTimingFunction` are Reanimated 4 CSS-transition style keys, not
// part of RN's own `ViewStyle`, which `StyleSheet.create` types strictly.
const pressTransition = {
  transform: [{ scale: 1 }],
  transitionProperty: 'transform',
  transitionDuration: '120ms',
  transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
};

const pressedStyle = { transform: [{ scale: 0.97 }] };
