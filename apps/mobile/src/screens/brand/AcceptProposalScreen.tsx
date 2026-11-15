import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BrandCampaignsStackParamList } from '../../navigation/types';
import { useAcceptProposal, useCollaboration } from '../../hooks/api/useCollaborations';
import { useTopUpEscrow } from '../../hooks/api/useEscrow';
import { PaymobCheckout } from '../../components/PaymobCheckout';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { AppText } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { parseApiError } from '../../services/apiError';
import { formatAmount } from '../../utils/format';
import { colors, radius, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandCampaignsStackParamList, 'AcceptProposal'>;

const POLL_TIMEOUT_MS = 60_000;

/**
 * TASK-P2-13: AcceptProposalScreen (REPLACE).
 * On the normal path, acceptProposal allocates from campaign escrow and immediately returns status 'funded'.
 * This screen displays the funded split confirmation and navigates to CollaborationDetail.
 * When the brief escrow is short, the API answers `insufficient_escrow` with the shortfall.
 * The brand then adds exactly that amount and the accept runs again. Nothing is charged silently.
 */
export function AcceptProposalScreen({ route, navigation }: Props) {
  const { proposalId } = route.params;
  const { t } = useTranslation();
  const acceptProposal = useAcceptProposal();

  const [collaborationId, setCollaborationId] = useState<string | undefined>();
  const [polling, setPolling] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [shortfall, setShortfall] = useState<{ campaignId: string; amount: string } | null>(
    null,
  );
  const [topUpCheckoutUrl, setTopUpCheckoutUrl] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const topUp = useTopUpEscrow(shortfall?.campaignId ?? '');

  const runAccept = () => {
    setShortfall(null);
    setTopUpCheckoutUrl(null);
    acceptProposal.mutate(proposalId, {
      onSuccess: (data) => {
        setCollaborationId(data.collaborationId);
      },
      onError: (err) => {
        const parsed = parseApiError(err);
        if (parsed.code !== 'insufficient_escrow') return;
        const amount = parsed.details?.find((d) => d.field === 'shortfall')?.message;
        const campaignId = parsed.details?.find((d) => d.field === 'campaignId')?.message;
        if (amount && campaignId) setShortfall({ campaignId, amount });
      },
    });
  };

  useEffect(() => {
    runAccept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  const startTopUp = () => {
    if (!shortfall) return;
    topUp.mutate(
      { amount: Number(shortfall.amount), method: 'card' },
      {
        onSuccess: (data) => {
          if (/^https?:/.test(data.checkoutUrl)) {
            setTopUpCheckoutUrl(data.checkoutUrl);
          } else {
            runAccept();
          }
        },
      },
    );
  };

  const collaborationQuery = useCollaboration(collaborationId, { poll: polling });
  const status = collaborationQuery.data?.status;

  useEffect(() => {
    if (polling && status && status !== 'pending_payment') {
      setPolling(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [polling, status]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startPolling = () => {
    setPolling(true);
    timeoutRef.current = setTimeout(() => {
      setPolling(false);
      setTimedOut(true);
    }, POLL_TIMEOUT_MS);
  };

  if (acceptProposal.isIdle || acceptProposal.isPending) {
    return <LoadingState />;
  }

  if (topUpCheckoutUrl) {
    return (
      <View style={styles.container}>
        <PaymobCheckout
          checkoutUrl={topUpCheckoutUrl}
          onRedirectDetected={() => setTimeout(runAccept, 2500)}
        />
      </View>
    );
  }

  if (acceptProposal.isError && shortfall) {
    const shown = formatAmount(shortfall.amount);
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <Card tone="canvas" style={styles.successCard}>
          <AppText variant="titleMd" color="ink" style={styles.textCenter}>
            {t('brand.escrow.shortfallTitle', 'Not enough escrow')}
          </AppText>
          <AppText variant="body" color="body" style={styles.detailText}>
            {t(
              'brand.escrow.shortfallMessage',
              'This brief holds less than the proposal costs. Add EGP {{amount}} to accept it.',
              { amount: shown },
            )}
          </AppText>
          {topUp.isError ? (
            <AppText variant="bodySm" color="danger" style={styles.textCenter} accessibilityRole="alert">
              {parseApiError(topUp.error).message}
            </AppText>
          ) : null}
          <Button
            title={t('brand.escrow.topUpAction', 'Add EGP {{amount}} to escrow', { amount: shown })}
            loading={topUp.isPending}
            onPress={startTopUp}
          />
          <Button
            title={t('common.back', 'Back')}
            variant="secondary"
            onPress={() => navigation.goBack()}
          />
        </Card>
      </SafeAreaView>
    );
  }

  if (acceptProposal.isError) {
    return (
      <ErrorState
        message={parseApiError(acceptProposal.error).message}
        onRetry={runAccept}
      />
    );
  }

  const result = acceptProposal.data;

  // Normal Phase 2 path: Status is already funded from campaign escrow allocation
  if (result.status === 'funded' || status === 'funded') {
    const targetCollabId = collaborationId || result.collaborationId;
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <Card tone="canvas" style={styles.successCard}>
          <AppText variant="titleMd" color="success" style={styles.textCenter}>
            {t('brand.acceptProposal.funded', 'Collaboration Funded')}
          </AppText>
          <AppText variant="body" color="body" style={styles.detailText}>
            {t(
              'brand.acceptProposal.allocatedSuccess',
              'Creator fee of {{price}} {{currency}} plus platform fee {{fee}} {{currency}} allocated from escrow.',
              {
                price: result.creatorPrice,
                fee: result.platformFee,
                currency: result.currency,
              },
            )}
          </AppText>
          <Button
            title={t('common.done', 'Go to collaboration')}
            onPress={() =>
              navigation.replace('CollaborationDetail', { collaborationId: targetCollabId })
            }
          />
        </Card>
      </SafeAreaView>
    );
  }

  // Top-up or payment failure states
  if (status && status !== 'pending_payment') {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <AppText variant="body" color="danger" style={styles.textCenter}>
          {t('brand.acceptProposal.failed', 'Payment failed. Please try again.')}
        </AppText>
        <Button
          title={t('common.back', 'Back')}
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  if (timedOut) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <AppText variant="body" color="body" style={styles.textCenter}>
          {t('brand.acceptProposal.timeout', 'Payment confirmation timed out.')}
        </AppText>
        <Button
          title={t('common.back', 'Back')}
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  if (polling) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <AppText variant="body" color="body" style={styles.textCenter}>
          {t('brand.acceptProposal.waiting', 'Confirming payment...')}
        </AppText>
      </SafeAreaView>
    );
  }

  // If checkoutUrl is provided (top up payment required)
  if (result.checkoutUrl) {
    return (
      <View style={styles.container}>
        <PaymobCheckout
          checkoutUrl={result.checkoutUrl}
          onRedirectDetected={startPolling}
        />
      </View>
    );
  }

  return <LoadingState />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  center: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successCard: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  textCenter: {
    textAlign: 'center',
  },
  detailText: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
