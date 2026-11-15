import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { BrandBriefsStackParamList } from '../../navigation/types';
import { useCreatorProfilePreview } from '../../hooks/api/useProposals';
import { useAcceptProposal } from '../../hooks/api/useCollaborations';
import { Card } from '../../components/ui/Card';
import { AppText } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { BottomActionBar } from '../../components/ui/BottomActionBar';
import { AppBottomSheet } from '../../components/ui/BottomSheet';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { parseApiError } from '../../services/apiError';
import { colors, radius, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandBriefsStackParamList, 'CreatorProfilePreview'>;

function getInitials(name?: string | null): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * TASK-P2-13: CreatorProfilePreviewScreen (artboard 4d).
 * Shows creator avatar, display name, 3 stat tiles (approval rate, average revisions, jobs done),
 * 4 portfolio tiles, and sticky "Accept proposal · EGP {amount}" action.
 * Handles `insufficient_escrow` by displaying a shortfall sheet with top-up action.
 */
export function CreatorProfilePreviewScreen({ route, navigation }: Props) {
  const { proposalId } = route.params;
  const { t } = useTranslation();

  const previewQuery = useCreatorProfilePreview(proposalId);
  const acceptProposal = useAcceptProposal();

  const sheetRef = useRef<BottomSheetModal>(null);
  const [shortfall, setShortfall] = useState<string>('0.00');

  if (previewQuery.isLoading) {
    return <LoadingState />;
  }

  if (previewQuery.isError || !previewQuery.data) {
    return (
      <ErrorState
        message={parseApiError(previewQuery.error).message}
        onRetry={() => previewQuery.refetch()}
      />
    );
  }

  const profile = previewQuery.data;
  const proposal = profile.proposal;
  const nichesText = (profile.niches ?? []).map((n: string) => t(`niche.${n}`, n)).join(' · ');
  const metaText = [profile.city, nichesText].filter(Boolean).join(' · ');

  const handleAccept = () => {
    acceptProposal.mutate(proposalId, {
      onSuccess: (data) => {
        if (data.status === 'funded') {
          navigation.replace('CollaborationDetail', { collaborationId: data.collaborationId });
        } else {
          // If top up or pending payment checkout is required
          navigation.navigate('AcceptProposal', { proposalId });
        }
      },
      onError: (err) => {
        const parsed = parseApiError(err);
        if (parsed.code === 'insufficient_escrow') {
          // Look for shortfall amount in error details or message
          const shortfallMsg = parsed.details?.[0]?.message || '0.00';
          const match = shortfallMsg.match(/[\d,.]+/);
          const shortfallVal = match ? match[0] : '0.00';
          setShortfall(shortfallVal);
          sheetRef.current?.present();
        } else {
          sheetRef.current?.dismiss();
        }
      },
    });
  };

  const handleTopUpNavigate = () => {
    sheetRef.current?.dismiss();
    navigation.navigate('AcceptProposal', { proposalId });
  };

  // Four portfolio tiles
  const portfolioItems = profile.portfolio.slice(0, 4);
  const emptyPortfolioSlots = Math.max(0, 4 - portfolioItems.length);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Creator header (artboard 4d) */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <AppText variant="titleLg" color="ink">
              {getInitials(profile.displayName)}
            </AppText>
          </View>
          <AppText variant="titleLg" color="ink" style={styles.displayName}>
            {profile.displayName || t('creator.anonymous', 'Creator')}
          </AppText>
          {metaText ? (
            <AppText variant="caption" color="muted" style={styles.meta}>
              {metaText}
            </AppText>
          ) : null}
        </View>

        {/* 3 Stat tiles (artboard 4d) */}
        <View style={styles.statsRow}>
          <Card tone="canvas" style={styles.statTile}>
            <AppText variant="titleMd" color="ink">
              {profile.approvalRate}%
            </AppText>
            <AppText variant="caption" color="muted" style={styles.statLabel}>
              {t('creator.stats.approvalRate', 'Approval rate')}
            </AppText>
          </Card>
          <Card tone="canvas" style={styles.statTile}>
            <AppText variant="titleMd" color="ink">
              {profile.averageRevisions}
            </AppText>
            <AppText variant="caption" color="muted" style={styles.statLabel}>
              {t('creator.stats.avgRevisions', 'Avg. revisions')}
            </AppText>
          </Card>
          <Card tone="canvas" style={styles.statTile}>
            <AppText variant="titleMd" color="ink">
              {profile.jobsDone}
            </AppText>
            <AppText variant="caption" color="muted" style={styles.statLabel}>
              {t('creator.stats.jobsDone', 'Jobs done')}
            </AppText>
          </Card>
        </View>

        {/* Pitch section */}
        {proposal.pitch ? (
          <View style={styles.pitchSection}>
            <AppText variant="label" color="muted" style={styles.sectionLabel}>
              {t('brand.proposals.pitch', 'Pitch')}
            </AppText>
            <Card tone="canvas" style={styles.pitchCard}>
              <AppText variant="body" color="body">
                {proposal.pitch}
              </AppText>
            </Card>
          </View>
        ) : null}

        {/* Portfolio 2x2 grid (artboard 4d) */}
        <View style={styles.portfolioSection}>
          <AppText variant="label" color="muted" style={styles.sectionLabel}>
            {t('creator.portfolio.title', 'Portfolio')}
          </AppText>
          <View style={styles.portfolioGrid}>
            {portfolioItems.map((item: { id: string; mediaUrl: string; mediaType: string }) => (
              <Card key={item.id} tone="canvas" style={styles.portfolioTile}>
                <AppText variant="caption" color="muted">
                  {item.mediaType}
                </AppText>
              </Card>
            ))}
            {Array.from({ length: emptyPortfolioSlots }).map((_, i) => (
              <Card key={`empty-${i}`} tone="canvas" style={styles.portfolioTile}>
                <AppText variant="caption" color="muted">
                  {t('creator.portfolio.sample', 'Sample')}
                </AppText>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom bar with Accept proposal action (artboard 4d) */}
      <BottomActionBar>
        <Button
          title={`${t('brand.proposals.acceptProposal', 'Accept proposal')} · ${proposal.currency} ${proposal.price}`}
          loading={acceptProposal.isPending}
          onPress={handleAccept}
        />
      </BottomActionBar>

      {/* Insufficient Escrow Shortfall Sheet */}
      <AppBottomSheet ref={sheetRef} snapPoints={['35%']}>
        <View style={styles.sheetContent}>
          <AppText variant="titleSm" color="ink" style={styles.sheetTitle}>
            {t('brand.escrow.shortfallTitle', 'Insufficient escrow')}
          </AppText>
          <AppText variant="body" color="body" style={styles.sheetBody}>
            {t(
              'brand.escrow.shortfallMessage',
              'Available escrow is below the proposal cost. Add EGP {{amount}} to proceed.',
              { amount: shortfall },
            )}
          </AppText>
          <View style={styles.sheetActions}>
            <Button
              title={t('brand.escrow.topUpAction', 'Add EGP {{amount}} to escrow', {
                amount: shortfall,
              })}
              onPress={handleTopUpNavigate}
            />
          </View>
        </View>
      </AppBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.signatureMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  displayName: {
    marginBottom: spacing.xxs,
    textAlign: 'center',
  },
  meta: {
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statTile: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  statLabel: {
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  pitchSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: spacing.xs,
  },
  pitchCard: {
    padding: spacing.md,
    borderRadius: radius.md,
  },
  portfolioSection: {
    marginBottom: spacing.lg,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  portfolioTile: {
    width: '48%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  sheetContent: {
    padding: spacing.lg,
  },
  sheetTitle: {
    marginBottom: spacing.xs,
  },
  sheetBody: {
    marginBottom: spacing.lg,
  },
  sheetActions: {
    gap: spacing.sm,
  },
});
