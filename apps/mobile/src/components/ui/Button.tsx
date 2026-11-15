import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { colors, radius, sizes, spacing } from '../../theme/tokens';
import { AppText } from './Text';
import { Icon, type IconName } from './Icon';

type ColorRole = keyof typeof colors;
type ButtonVariant = 'primary' | 'secondary' | 'secondaryOnDark' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: IconName;
  iconPosition?: 'start' | 'end';
  /** Default true: matches every existing call site, which already sits in a stretching column. */
  fullWidth?: boolean;
}

const VARIANT_BACKGROUND: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline },
  secondaryOnDark: { backgroundColor: colors.surface },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danger },
};

const VARIANT_LABEL_COLOR: Record<ButtonVariant, ColorRole> = {
  primary: 'onPrimary',
  secondary: 'ink',
  secondaryOnDark: 'ink',
  ghost: 'link',
  danger: 'onPrimary',
};

const VARIANT_SPINNER_COLOR: Record<ButtonVariant, string> = {
  primary: colors.onPrimary,
  secondary: colors.ink,
  secondaryOnDark: colors.ink,
  ghost: colors.link,
  danger: colors.onPrimary,
};

/**
 * TASK-P1-015. Never `radius.pill` (DES-P1-010 reserves pill shapes for
 * chips/badges). Disabled state uses `surfaceStrong` + `borderStrong`
 * label, never `opacity: 0.5` (DES-P1-009, GUD-001).
 */
export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'start',
  fullWidth = true,
  ...props
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;
  const labelColor: ColorRole = isDisabled ? 'borderStrong' : VARIANT_LABEL_COLOR[variant];
  const spinnerColor = isDisabled ? colors.borderStrong : VARIANT_SPINNER_COLOR[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={16}
      {...props}
    >
      <Animated.View
        style={[
          baseStyle,
          VARIANT_BACKGROUND[variant],
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          pressed &&
            !isDisabled &&
            (variant === 'primary' ? styles.primaryPressed : styles.pressed),
        ]}
      >
        <View style={[styles.content, loading && styles.contentHidden]}>
          {icon && iconPosition === 'start' ? (
            <Icon name={icon} size={18} color={labelColor} />
          ) : null}
          <AppText variant="button" color={labelColor} numberOfLines={2}>
            {title}
          </AppText>
          {icon && iconPosition === 'end' ? (
            <Icon name={icon} size={18} color={labelColor} />
          ) : null}
        </View>
        {loading ? (
          <View style={styles.spinner}>
            <ActivityIndicator color={spinnerColor} />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const EASE_OUT_CSS = 'cubic-bezier(0.23, 1, 0.32, 1)';

// Kept outside StyleSheet.create: `transitionProperty`/`transitionDuration`/
// `transitionTimingFunction` are Reanimated 4 CSS-transition style keys
// (REQ-007's press-in scale), not part of RN's own `ViewStyle`, and
// `StyleSheet.create` types its input strictly as `ViewStyle`.
const baseStyle = {
  minHeight: sizes.buttonHeight,
  borderRadius: radius.lg,
  paddingHorizontal: spacing.lg,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  transform: [{ scale: 1 }],
  transitionProperty: 'transform',
  transitionDuration: '120ms',
  transitionTimingFunction: EASE_OUT_CSS,
};

const styles = StyleSheet.create({
  fullWidth: { alignSelf: 'stretch' },
  pressed: { transform: [{ scale: 0.97 }] },
  primaryPressed: { backgroundColor: colors.primaryActive, transform: [{ scale: 0.97 }] },
  disabled: { backgroundColor: colors.surfaceStrong, borderWidth: 0 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  contentHidden: { opacity: 0 },
  spinner: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
