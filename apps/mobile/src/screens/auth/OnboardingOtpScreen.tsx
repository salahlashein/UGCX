import React, { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { OtpInput } from '../../components/forms/OtpInput';
import { colors, spacing, radius } from '../../theme/tokens';
import { useVerifyOtp } from '../../hooks/api/useAuth';
import { saveSession } from '../../store/sessionPersistence';
import { apiClient } from '../../services/apiClient';

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingOtp'>;

export function OnboardingOtpScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState('0000');
  const role = route.params.role;
  const email = route.params.email;
  const phone = route.params.phone;
  const destination = email || phone || t('auth.otp.yourEmail', 'your email');
  const verifyOtp = useVerifyOtp();

  const complete = otp.length === 4;

  const handleNext = () => {
    verifyOtp.mutate(
      { email, phone, otp, role },
      {
        onSuccess: async (data) => {
          try {
            const isBrand = data.role === 'brand';

            if (isBrand) {
              await saveSession(
                { accessToken: data.accessToken, refreshToken: data.refreshToken },
                { id: data.userId, role: data.role },
              );
            } else {
              try {
                const res = await apiClient.get('/creators/me', {
                  headers: { Authorization: `Bearer ${data.accessToken}` },
                });
                const profile = res.data.data;
                
                if (profile.displayName) {
                  await saveSession(
                    { accessToken: data.accessToken, refreshToken: data.refreshToken },
                    { id: data.userId, role: data.role },
                  );
                } else {
                  navigation.navigate('OnboardingBasics', { role });
                }
              } catch {
                navigation.navigate('OnboardingBasics', { role });
              }
            }
          } catch (err) {
            console.error('Failed to process OTP step', err);
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
          {t('auth.otp.title', 'Enter the code')}
        </AppText>
        <AppText variant="body" color="muted" style={styles.sub}>
          {t('auth.otp.sentTo', 'Sent to {{destination}}', { destination })}
        </AppText>
        <View style={styles.row}>
          <OtpInput
            length={4}
            value={otp}
            onChange={setOtp}
            boxWidth={60}
            boxHeight={64}
          />
        </View>
        <AppText variant="caption" color="link" style={styles.resend}>
          {t('auth.otp.resend', 'Resend code in 0:42')}
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
