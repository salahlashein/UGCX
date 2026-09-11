import React, { useState } from 'react';
import { StyleSheet, View, TextInput as RNTextInput, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { colors, spacing, radius } from '../../theme/tokens';

import { useSendOtp } from '../../hooks/api/useAuth';

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingPhoneNumber'>;

export function OnboardingPhoneNumberScreen({ navigation, route }: Props) {
  const [phone, setPhone] = useState('');
  const canContinue = phone.replace(/\D/g, '').length >= 10;
  const role = route.params.role;
  const sendOtp = useSendOtp();

  const handleSendCode = () => {
    const formattedPhone = `+20${phone.replace(/\D/g, '')}`;
    sendOtp.mutate(
      { phone: formattedPhone, role },
      {
        onSuccess: () => {
          navigation.navigate('OnboardingOtp', { role, phone: formattedPhone });
        },
        onError: (err) => {
          console.error(err);
          // In a real app, show a toast. For now, navigate anyway since we're in dev.
          navigation.navigate('OnboardingOtp', { role, phone: formattedPhone });
        },
      },
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <AppText variant="displayLg" color="ink" style={styles.heading}>
          What's your number?
        </AppText>
        <AppText variant="body" color="muted" style={styles.sub}>
          We'll text you a code to confirm it's you.
        </AppText>
        <View style={styles.row}>
          <View style={styles.prefix}>
            <AppText variant="label" color="ink">
              +20
            </AppText>
          </View>
          <RNTextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="100 123 4471"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            style={styles.input}
            autoFocus
          />
        </View>
        <AppText variant="caption" color="muted" style={styles.hint}>
          Used for delivery updates and account recovery — never shown to brands.
        </AppText>
      </View>
      <Pressable
        disabled={!canContinue}
        style={[styles.cta, !canContinue && styles.ctaDisabled]}
        onPress={handleSendCode}
      >
        <AppText variant="label" style={canContinue ? styles.ctaText : styles.ctaTextDisabled}>
          Send code
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.lg,
    paddingTop: 96,
    paddingBottom: spacing.xl,
  },
  content: { flex: 1, justifyContent: 'center' },
  heading: { marginBottom: spacing.xs },
  sub: { marginBottom: spacing.xl },
  row: { flexDirection: 'row', gap: 10, height: 52, marginBottom: 10 },
  prefix: {
    width: 64,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    fontSize: 17,
    fontWeight: '500',
    color: colors.ink,
  },
  hint: { marginTop: spacing.xs },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: colors.surfaceStrong },
  ctaText: { color: colors.onPrimary },
  ctaTextDisabled: { color: colors.borderStrong },
});
