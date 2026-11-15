import React, { useState } from 'react';
import { StyleSheet, View, TextInput as RNTextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { colors, spacing, radius } from '../../theme/tokens';

import { useSendOtp } from '../../hooks/api/useAuth';

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingPhoneNumber'>;

export function OnboardingPhoneNumberScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const canContinue = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const role = route.params.role;
  const sendOtp = useSendOtp();

  const handleSendCode = () => {
    const trimmedEmail = email.trim().toLowerCase();
    sendOtp.mutate(
      { email: trimmedEmail, role },
      {
        onSuccess: () => {
          navigation.navigate('OnboardingOtp', { role, email: trimmedEmail });
        },
        onError: (err) => {
          console.error(err);
          // In a dev/demo fallback, navigate anyway
          navigation.navigate('OnboardingOtp', { role, email: trimmedEmail });
        },
      },
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <AppText variant="displayLg" color="ink" style={styles.heading}>
          {t('auth.phone.title', "What's your email?")}
        </AppText>
        <AppText variant="body" color="muted" style={styles.sub}>
          {t('auth.phone.subtitle', "We'll email you a code to confirm it's you.")}
        </AppText>
        <View style={styles.row}>
          <RNTextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.phone.placeholder', 'name@example.com')}
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            autoFocus
          />
        </View>
        <AppText variant="caption" color="muted" style={styles.hint}>
          {t('auth.phone.hint', 'Used for secure login, brief updates, and receipts.')}
        </AppText>
      </View>
      <Pressable
        disabled={!canContinue}
        style={[styles.cta, !canContinue && styles.ctaDisabled]}
        onPress={handleSendCode}
      >
        <AppText variant="label" style={canContinue ? styles.ctaText : styles.ctaTextDisabled}>
          {t('auth.phone.sendCode', 'Send code')}
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
