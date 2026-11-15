import { useState } from 'react';
import { Pressable, StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BrandCampaignsStackParamList } from '../../navigation/types';
import { useCampaign } from '../../hooks/api/useCampaigns';
import { useSubmitManualEscrow } from '../../hooks/api/useEscrow';
import { AppText } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SignatureCard } from '../../components/ui/SignatureCard';
import { BottomActionBar } from '../../components/ui/BottomActionBar';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { TextInput } from '../../components/ui/TextInput';
import { parseApiError } from '../../services/apiError';
import { formatAmount } from '../../utils/format';
import { colors, radius, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandCampaignsStackParamList, 'FundEscrow'>;

export function FundEscrowScreen({ route, navigation }: Props) {
  const { campaignId } = route.params;
  const { t } = useTranslation();

  const campaignQuery = useCampaign(campaignId);
  const campaign = campaignQuery.data;

  const [method, setMethod] = useState<'instapay' | 'vodafone_cash'>('instapay');
  const [reference, setReference] = useState('');
  const [senderAccount, setSenderAccount] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitManual = useSubmitManualEscrow(campaignId);

  const min = campaign?.budgetMin ? parseFloat(campaign.budgetMin) : 0;
  const max = campaign?.budgetMax ? parseFloat(campaign.budgetMax) : 0;
  const midpoint = Math.round((min + max) / 2);
  const formattedMidpoint = midpoint > 0 ? formatAmount(midpoint) : '3,200';
  const rangeDisplay = min > 0 && max > 0 ? `${formatAmount(min)}–${formatAmount(max)}` : '2,500–4,000';

  const canSubmit = reference.trim().length >= 4;

  const handleSubmit = () => {
    submitManual.mutate(
      {
        method,
        transactionReference: reference.trim(),
        senderAccount: senderAccount.trim() || undefined,
        amount: midpoint,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
      },
    );
  };

  if (campaignQuery.isLoading) {
    return <LoadingState />;
  }

  if (campaignQuery.isError || !campaign) {
    return (
      <ErrorState
        message={parseApiError(campaignQuery.error).message}
        onRetry={() => campaignQuery.refetch()}
      />
    );
  }

  if (submitted) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.container}>
          <Card style={styles.successCard}>
            <View style={styles.successIconBadge}>
              <AppText variant="titleMd" color="primary">✓</AppText>
            </View>
            <AppText variant="titleLg" color="ink" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
              Payment Proof Submitted
            </AppText>
            <AppText variant="body" color="muted" style={{ textAlign: 'center', marginBottom: spacing.xl }}>
              Our admin team will verify your transfer and activate your brief.
            </AppText>
            <Button
              title="Back to My Briefs"
              variant="primary"
              onPress={() => navigation.navigate('MyBriefs')}
            />
          </Card>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <AppText variant="displayMd" color="ink">
              {t('brand.fundEscrow.title', 'Fund escrow')}
            </AppText>
            <AppText variant="body" color="muted" style={styles.subheading}>
              Direct manual transfer via InstaPay or Vodafone Cash. Funds are secured until you approve deliverables.
            </AppText>
          </View>

          <SignatureCard variant="dark" style={styles.signatureCard}>
            <AppText variant="label" color="onPrimary" style={styles.kicker}>
              {t('brand.fundEscrow.totalKicker', 'TOTAL TO FUND')}
            </AppText>
            <View style={styles.amountRow}>
              <AppText variant="displayLg" color="onPrimary">
                EGP{' '}
              </AppText>
              <AppText variant="displayLg" color="onPrimary">
                {formattedMidpoint}
              </AppText>
            </View>
            <AppText variant="caption" color="onPrimary" style={styles.budgetSub}>
              {t('brand.fundEscrow.budgetSub', 'Budget · midpoint of {{range}}', {
                range: rangeDisplay,
              })}
            </AppText>
          </SignatureCard>

          <View style={styles.methodsSection}>
            <AppText variant="label" color="muted" style={styles.methodLabel}>
              Select Payment Method
            </AppText>

            <Pressable onPress={() => setMethod('instapay')}>
              <Card
                tone="canvas"
                style={[
                  styles.methodCard,
                  method === 'instapay' && styles.methodSelected,
                ]}
              >
                <View style={styles.methodRow}>
                  <View
                    style={[
                      styles.radioCircle,
                      method === 'instapay' && styles.radioFilled,
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <AppText variant="label" color="ink">
                      InstaPay Transfer
                    </AppText>
                    <AppText variant="caption" color="muted">
                      Send to address: ugcx@instapay
                    </AppText>
                  </View>
                </View>
              </Card>
            </Pressable>

            <Pressable onPress={() => setMethod('vodafone_cash')}>
              <Card
                tone="canvas"
                style={[
                  styles.methodCard,
                  method === 'vodafone_cash' && styles.methodSelected,
                ]}
              >
                <View style={styles.methodRow}>
                  <View
                    style={[
                      styles.radioCircle,
                      method === 'vodafone_cash' && styles.radioFilled,
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <AppText variant="label" color="ink">
                      Vodafone Cash
                    </AppText>
                    <AppText variant="caption" color="muted">
                      Send to wallet: 0100 123 4471
                    </AppText>
                  </View>
                </View>
              </Card>
            </Pressable>
          </View>

          <View style={styles.formSection}>
            <TextInput
              label="Transaction Reference / Order ID"
              placeholder="e.g. 987654321"
              value={reference}
              onChangeText={setReference}
              hint="Enter the reference number from your transfer confirmation."
            />
            <TextInput
              label="Sender Handle or Phone (Optional)"
              placeholder={method === 'instapay' ? 'e.g. name@instapay' : 'e.g. 010xxxxxxxx'}
              value={senderAccount}
              onChangeText={setSenderAccount}
              hint="Helps admin verify your payment faster."
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomActionBar>
        <Button
          title="I Have Transferred & Submit"
          variant="primary"
          disabled={!canSubmit}
          loading={submitManual.isPending}
          onPress={handleSubmit}
        />
      </BottomActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.section,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
  },
  subheading: {
    marginTop: spacing.xs,
  },
  signatureCard: {
    marginBottom: spacing.xl,
  },
  kicker: {
    letterSpacing: 1.2,
    opacity: 0.8,
  },
  amountRow: {
    marginVertical: spacing.xs,
  },
  budgetSub: {
    opacity: 0.7,
  },
  methodsSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  methodLabel: {
    marginBottom: spacing.xxs,
  },
  methodCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  methodSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  radioFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  formSection: {
    gap: spacing.lg,
  },
  successCard: {
    margin: spacing.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  successIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
});
