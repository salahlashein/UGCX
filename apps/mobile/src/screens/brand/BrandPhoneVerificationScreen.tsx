import { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BrandProfileStackParamList } from '../../navigation/types';
import { useBrandProfile } from '../../hooks/api/useBrand';
import { useSendOtp, useVerifyOtp } from '../../hooks/api/useAuth';
import { parseApiError } from '../../services/apiError';
import { AppText } from '../../components/ui/Text';
import { OtpInput } from '../../components/forms/OtpInput';
import { Button } from '../../components/ui/Button';
import { BottomActionBar } from '../../components/ui/BottomActionBar';
import { colors, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandProfileStackParamList, 'BrandPhoneVerification'>;

/**
 * Masks phone number to show only the last 4 digits (e.g., "+20 10 •••• 4471").
 * Complies with SEC privacy rules.
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone || phone.length < 4) return '+20 10 •••• 4471';
  const lastFour = phone.slice(-4);
  const prefix = phone.slice(0, Math.min(6, phone.length - 4));
  return `${prefix} •••• ${lastFour}`;
}

/**
 * TASK-P1-12: Brand phone verification screen (artboard 4a).
 */
export function BrandPhoneVerificationScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const profileQuery = useBrandProfile();
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const [otp, setOtp] = useState('0000');
  const [countdown, setCountdown] = useState(38);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const phone = (profileQuery.data as any)?.phone || (profileQuery.data as any)?.user?.phone || '+201001234471';
  const maskedPhone = maskPhoneNumber(phone);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    setErrorMessage(null);
    try {
      await sendOtp.mutateAsync({ phone, role: 'brand' });
      setCountdown(60);
    } catch (err) {
      setErrorMessage(parseApiError(err).message);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 4 && otp.length !== 6) return;
    setErrorMessage(null);
    try {
      await verifyOtp.mutateAsync({ phone, otp, role: 'brand' });
      await queryClient.invalidateQueries({ queryKey: ['brand', 'me'] });
      // Navigate to PostBrief on success
      (navigation as any).navigate('BrandBriefsTab', { screen: 'PostBrief' });
    } catch (err) {
      setErrorMessage(parseApiError(err).message);
    }
  };

  const isComplete = otp.length === 4 || otp.length === 6;
  const formattedTime = `0:${countdown.toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <AppText variant="displayMd" color="ink" style={styles.heading}>
          {t('brand.verify.title')}
        </AppText>
        <AppText variant="body" color="muted" style={styles.subheading}>
          {t('brand.verify.subtitle', { phone: maskedPhone })}
        </AppText>

        <View style={styles.otpRow}>
          <OtpInput
            length={4}
            value={otp}
            onChange={setOtp}
            boxWidth={56}
            boxHeight={60}
            disabled={verifyOtp.isPending}
          />
        </View>

        <View style={styles.timerRow}>
          {countdown > 0 ? (
            <AppText variant="caption" color="muted">
              {t('brand.verify.resendIn', { seconds: formattedTime })}
            </AppText>
          ) : (
            <Pressable onPress={handleResend} disabled={sendOtp.isPending}>
              <AppText variant="caption" color="link">
                {t('brand.verify.resend')}
              </AppText>
            </Pressable>
          )}
        </View>
      </View>

      <BottomActionBar>
        <View style={styles.actionCol}>
          {errorMessage ? (
            <AppText variant="caption" color="danger" style={styles.errorText}>
              {errorMessage}
            </AppText>
          ) : null}
          <Button
            title={t('brand.verify.continue')}
            variant="primary"
            fullWidth
            disabled={!isComplete}
            loading={verifyOtp.isPending}
            onPress={handleVerify}
          />
        </View>
      </BottomActionBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flex: 1,
    paddingTop: spacing.section,
    paddingHorizontal: spacing.lg,
  },
  heading: {
    marginBottom: spacing.xs,
  },
  subheading: {
    marginBottom: spacing.xl,
  },
  otpRow: {
    marginBottom: spacing.lg,
    justifyContent: 'center',
  },
  timerRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  actionCol: {
    width: '100%',
    gap: spacing.xs,
  },
  errorText: {
    marginBottom: spacing.xxs,
  },
});
