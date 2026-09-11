import { useState } from 'react';
import {
  I18nManager,
  StyleSheet,
  TextInput as RNTextInput,
  View,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { colors, radius, sizes, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { fontFamilyFor, LINE_HEIGHT_MULTIPLIER_AR } from '../../theme/fonts';
import { AppText } from './Text';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * TASK-P1-017. Focus adds 1px of border by trading it for 1px of padding
 * (borderWidth 1->2, paddingVertical 12->11, paddingHorizontal 16->15) so
 * the box never resizes. Never sets `textAlign` (R2): RN's unset default
 * already follows reading direction.
 */
export function TextInput({
  label,
  error,
  hint,
  style,
  editable = true,
  multiline,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const [focused, setFocused] = useState(false);
  const disabled = !editable;
  const isArabic = I18nManager.isRTL;
  const bodyRole = typography.body;

  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="caption" color="body" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <RNTextInput
        editable={editable}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            fontFamily: fontFamilyFor(bodyRole.weight, isArabic),
            fontWeight: String(bodyRole.weight) as TextStyle['fontWeight'],
            fontSize: bodyRole.fontSize,
            lineHeight: Math.round(
              bodyRole.lineHeight * (isArabic ? LINE_HEIGHT_MULTIPLIER_AR : 1),
            ),
          },
          multiline && styles.multiline,
          focused && !disabled && styles.focused,
          !!error && !disabled && styles.inputError,
          disabled && styles.disabled,
          style,
        ]}
        accessibilityLabel={label}
        accessibilityHint={hint}
        {...props}
      />
      {error ? (
        <AppText variant="bodySm" color="danger" accessibilityRole="alert" style={styles.hint}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="bodySm" color="muted" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { marginBottom: spacing.xxs },
  hint: { marginTop: spacing.xxs },
  input: {
    minHeight: sizes.inputHeight,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  focused: {
    borderWidth: 2,
    borderColor: colors.infoBorder,
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  inputError: { borderColor: colors.danger },
  disabled: { backgroundColor: colors.surfaceSoft, borderColor: colors.hairline },
});
