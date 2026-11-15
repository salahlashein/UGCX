import { useState } from 'react';
import { Alert, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BrandCampaignsStackParamList } from '../../navigation/types';
import { useCampaign } from '../../hooks/api/useCampaigns';
import { useEscrowBalance, useCloseBrief } from '../../hooks/api/useEscrow';
import { apiPost } from '../../services/apiHelpers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppText } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { parseApiError } from '../../services/apiError';
import { colors, radius, sizes, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandCampaignsStackParamList, 'EditLiveBrief'>;

export function EditLiveBriefScreen({ route, navigation }: Props) {
  const { campaignId } = route.params;
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const campaignQuery = useCampaign(campaignId);
  const escrowQuery = useEscrowBalance(campaignId);
  const closeBrief = useCloseBrief(campaignId);

  const campaign = campaignQuery.data;
  const escrow = escrowQuery.data;

  const pauseMutation = useMutation({
    mutationFn: () => apiPost(`/campaigns/${campaignId}/pause`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'mine'] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => apiPost(`/campaigns/${campaignId}/resume`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'mine'] });
    },
  });

  if (campaignQuery.isLoading || escrowQuery.isLoading) {
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

  const isPaused = campaign.status === 'paused';
  const refundAmount = escrow?.available ?? '0.00';
  const allocatedAmount = escrow?.allocated ?? '0.00';

  const handleCloseConfirm = () => {
    closeBrief.mutate(
      { reason: 'brief_closed' },
      {
        onSuccess: () => {
          setConfirmCloseOpen(false);
          navigation.goBack();
        },
        onError: (err) => {
          const parsed = parseApiError(err);
          Alert.alert(t('common.error.title'), parsed.message);
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <AppText variant="titleLg" color="ink" style={styles.title}>
            {campaign.title}
          </AppText>
          <StatusBadge domain="campaign" status={campaign.status} />
        </View>
        <AppText variant="caption" color="muted" style={styles.meta}>
          {t('brand.editLiveBrief.meta', 'Posted recently · Live brief')}
        </AppText>
      </View>

      <Card tone="canvas" style={styles.specsCard}>
        <View style={styles.specRow}>
          <AppText variant="body" color="muted">
            {t('brand.editLiveBrief.budgetRange', 'Budget range')}
          </AppText>
          <AppText variant="body" color="ink">
            EGP {campaign.budgetMin ?? '0'} – {campaign.budgetMax ?? '0'}
          </AppText>
        </View>

        <View style={styles.hairline} />

        <View style={styles.specRow}>
          <AppText variant="body" color="muted">
            {t('brand.editLiveBrief.deliverable', 'Deliverable')}
          </AppText>
          <AppText variant="body" color="ink">
            {campaign.durationSeconds ? `${campaign.durationSeconds}s · ` : ''}
            {t('brand.editLiveBrief.fixedPrice', 'fixed price')}
          </AppText>
        </View>

        <View style={styles.hairline} />

        <View style={styles.specRow}>
          <AppText variant="body" color="muted">
            {t('brand.editLiveBrief.escrowHeld', 'Escrow held')}
          </AppText>
          <AppText variant="body" color="ink">
            EGP {allocatedAmount}
          </AppText>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button
          title={
            isPaused
              ? t('brand.editLiveBrief.resumeBrief', 'Resume brief')
              : t('brand.editLiveBrief.pauseBrief', 'Pause brief')
          }
          variant="secondary"
          loading={pauseMutation.isPending || resumeMutation.isPending}
          onPress={() => {
            if (isPaused) {
              resumeMutation.mutate();
            } else {
              pauseMutation.mutate();
            }
          }}
        />

        <Button
          title={t(
            'brand.editLiveBrief.closeAction',
            'Close early & refund unspent escrow',
          )}
          variant="danger"
          onPress={() => setConfirmCloseOpen(true)}
        />
      </View>

      {/* Confirmation modal showing refund amount */}
      <Modal
        visible={confirmCloseOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmCloseOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Card tone="canvas" style={styles.modalContent}>
            <AppText variant="titleSm" color="ink">
              {t('brand.editLiveBrief.confirmCloseTitle', 'Close brief early?')}
            </AppText>
            <AppText variant="body" color="body" style={styles.modalBody}>
              {t(
                'brand.editLiveBrief.confirmCloseMessage',
                'Unspent escrow of EGP {{amount}} will be refunded to your payment method. Open proposals will be declined.',
                { amount: refundAmount },
              )}
            </AppText>
            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel', 'Cancel')}
                variant="secondary"
                onPress={() => setConfirmCloseOpen(false)}
              />
              <Button
                title={t('brand.editLiveBrief.confirmCloseBtn', 'Close & refund')}
                variant="danger"
                loading={closeBrief.isPending}
                onPress={handleCloseConfirm}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  meta: {
    marginTop: spacing.xs,
  },
  specsCard: {
    padding: spacing.md,
    marginBottom: spacing.xxl,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  hairline: {
    height: sizes.hairlineWidth,
    backgroundColor: colors.hairline,
  },
  actions: {
    gap: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalBody: {
    marginVertical: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});

