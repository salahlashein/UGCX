# Onboarding — Phone Number (2f)

Inserted before OTP. Egypt +20 prefix fixed, 96px centered layout matching the rest of onboarding.

```jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

export default function PhoneNumberScreen({ onSendCode }) {
  const [phone, setPhone] = useState('');
  const canContinue = phone.replace(/\D/g, '').length >= 10;

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={[type.displayLg, styles.heading]}>What's your number?</Text>
        <Text style={styles.sub}>We'll text you a code to confirm it's you.</Text>
        <View style={styles.row}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>+20</Text>
          </View>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="100 123 4471"
            keyboardType="phone-pad"
            style={styles.input}
            autoFocus
          />
        </View>
        <Text style={styles.hint}>Used for delivery updates and account recovery — never shown to brands.</Text>
      </View>
      <Pressable
        disabled={!canContinue}
        style={[styles.cta, !canContinue && styles.ctaDisabled]}
        onPress={() => onSendCode(`+20${phone}`)}
      >
        <Text style={[styles.ctaText, !canContinue && styles.ctaTextDisabled]}>Send code</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg, paddingTop: 96, paddingBottom: spacing.xl },
  content: { flex: 1, justifyContent: 'center' },
  heading: { color: colors.ink, marginBottom: spacing.xs },
  sub: { ...type.body, color: colors.muted, marginBottom: spacing.xl },
  row: { flexDirection: 'row', gap: 10, height: 52, marginBottom: 10 },
  prefix: { width: 64, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  prefixText: { ...type.label, color: colors.ink },
  input: { flex: 1, borderWidth: 2, borderColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: 14, fontSize: 17, fontWeight: '500', color: colors.ink },
  hint: { ...type.caption, color: colors.muted },
  cta: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  ctaDisabled: { backgroundColor: colors.surfaceStrong },
  ctaText: { ...type.label, color: colors.onPrimary },
  ctaTextDisabled: { color: colors.borderStrong },
});
```
