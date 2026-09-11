# Onboarding — Phone OTP

Screen 2a (step 2). CTA disabled until 4 digits entered.

```jsx
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

export default function OtpScreen({ phone = '+20 100 •••• 471', onContinue }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const inputs = useRef([]);
  const complete = digits.every((d) => d !== '');

  const setDigit = (i, val) => {
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < 3) inputs.current[i + 1]?.focus();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={[type.displayLg, styles.heading]}>Enter the code</Text>
        <Text style={styles.sub}>Sent to {phone}</Text>
        <View style={styles.row}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => (inputs.current[i] = r)}
              value={d}
              onChangeText={(v) => setDigit(i, v)}
              keyboardType="number-pad"
              maxLength={1}
              style={styles.box}
            />
          ))}
        </View>
        <Text style={styles.resend}>Resend code in 0:42</Text>
      </View>
      <Pressable
        disabled={!complete}
        style={[styles.cta, !complete && styles.ctaDisabled]}
        onPress={onContinue}
      >
        <Text style={[styles.ctaText, !complete && styles.ctaTextDisabled]}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg, paddingTop: 96, paddingBottom: spacing.xl },
  content: { flex: 1, justifyContent: 'center' },
  heading: { color: colors.ink, marginBottom: spacing.xs },
  sub: { ...type.body, color: colors.muted, marginBottom: spacing.xl },
  row: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  box: { flex: 1, height: 56, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, textAlign: 'center', fontSize: 22, fontWeight: '500', color: colors.ink },
  resend: { ...type.caption, color: colors.link },
  cta: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  ctaDisabled: { backgroundColor: colors.surfaceStrong },
  ctaText: { ...type.label, color: colors.onPrimary },
  ctaTextDisabled: { color: colors.borderStrong },
});

```
