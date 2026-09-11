import React, { useState, useRef } from 'react';
import { StyleSheet, View, TextInput as RNTextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { colors, spacing, radius } from '../../theme/tokens';
import { useVerifyOtp } from '../../hooks/api/useAuth';

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingOtp'>;

export function OnboardingOtpScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState(['', '', '', '']);
  const inputs = useRef<Array<RNTextInput | null>>([]);
  const role = route.params.role;
  const phone = route.params.phone || '+20 100 •••• 471';
  const verifyOtp = useVerifyOtp();

  const complete = digits.every((d) => d !== '');

  const setDigit = (i: number, val: string) => {
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < 3) inputs.current[i + 1]?.focus();
  };

  const handleNext = () => {
    const otpCode = digits.join('');
    verifyOtp.mutate(
      { phone, otp: otpCode, role },
      {
        onSuccess: async (data) => {
          try {
            const isBrand = data.role === 'brand';
            const endpoint = isBrand ? '/brands/me' : '/creators/me';
            const { apiClient } = require('../../services/apiClient');
            const { hydrateSession } = require('../../store/sessionPersistence');
            
            const res = await apiClient.get(endpoint);
            const profile = res.data.data;
            
            // If they have a display name or company name, they finished onboarding
            if (profile.displayName || profile.companyName) {
              await hydrateSession();
            } else {
              navigation.navigate('OnboardingBasics', { role });
            }
          } catch (err) {
            console.error('Failed to fetch profile during OTP step', err);
            navigation.navigate('OnboardingBasics', { role });
          }
        },
        onError: (err) => {
          console.error(err);
        },
      },
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <AppText variant="displayLg" color="ink" style={styles.heading}>
          Enter the code
        </AppText>
        <AppText variant="body" color="muted" style={styles.sub}>
          Sent to {phone}
        </AppText>
        <View style={styles.row}>
          {digits.map((d, i) => (
            <RNTextInput
              key={i}
              ref={(r) => {
                inputs.current[i] = r;
              }}
              value={d}
              onChangeText={(v) => setDigit(i, v)}
              keyboardType="number-pad"
              maxLength={1}
              style={styles.box}
            />
          ))}
        </View>
        <AppText variant="caption" color="link" style={styles.resend}>
          Resend code in 0:42
        </AppText>
      </View>
      <Pressable
        disabled={!complete}
        style={[styles.cta, !complete && styles.ctaDisabled]}
        onPress={handleNext}
      >
        <AppText variant="label" style={complete ? styles.ctaText : styles.ctaTextDisabled}>
          {t('common.continue')}
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
  row: { flexDirection: 'row', gap: 14, marginBottom: spacing.lg, justifyContent: 'center' },
  box: {
    width: 60,
    height: 64,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: colors.ink,
  },
  resend: { marginTop: spacing.md }, // if needed for spacing
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
