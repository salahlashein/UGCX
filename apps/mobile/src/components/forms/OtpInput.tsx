import React, { useRef } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  TextInput as RNTextInput,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  boxWidth?: number;
  boxHeight?: number;
  disabled?: boolean;
}

/**
 * Reusable OTP digit input component.
 * Extracted from OnboardingOtpScreen for BrandPhoneVerificationScreen and auth flows.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  boxWidth = 38,
  boxHeight = 48,
  disabled = false,
}: OtpInputProps) {
  const inputs = useRef<Array<RNTextInput | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const handleChangeText = (text: string, index: number) => {
    // If multiple characters are pasted
    if (text.length > 1) {
      const cleanText = text.replace(/[^0-9]/g, '');
      if (cleanText.length > 0) {
        const chars = [...digits];
        for (let i = 0; i < cleanText.length && index + i < length; i++) {
          chars[index + i] = cleanText[i];
        }
        const newValue = chars.join('').slice(0, length);
        onChange(newValue);
        const nextIndex = Math.min(index + cleanText.length, length - 1);
        inputs.current[nextIndex]?.focus();
        return;
      }
    }

    const char = text.slice(-1);
    const chars = [...digits];
    chars[index] = char;
    const newValue = chars.join('').slice(0, length);
    onChange(newValue);

    if (char && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, i) => (
        <RNTextInput
          key={i}
          ref={(r) => {
            inputs.current[i] = r;
          }}
          value={digit}
          onChangeText={(text) => handleChangeText(text, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={length}
          editable={!disabled}
          textAlign="center"
          style={[
            styles.box,
            {
              width: boxWidth,
              height: boxHeight,
              lineHeight: Platform.OS === 'web' ? boxHeight : undefined,
            },
            digit ? styles.boxFilled : null,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    color: colors.ink,
    fontSize: 22,
    fontWeight: '600',
    backgroundColor: colors.surface,
    textAlign: 'center',
    textAlignVertical: 'center',
    padding: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    includeFontPadding: false,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  boxFilled: {
    borderColor: colors.primary,
  },
});
