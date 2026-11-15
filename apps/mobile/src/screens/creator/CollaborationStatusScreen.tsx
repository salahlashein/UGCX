import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CreatorWorkStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { Card, PressableCard } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing, radius } from '../../theme/tokens';
import { useMyCollaborations } from '../../hooks/api/useCollaborations';
import { useCreatorEarnings, useCreatorProfile } from '../../hooks/api/useCreator';
import { formatAmount, initialsOf } from '../../utils/format';

type Props = NativeStackScreenProps<CreatorWorkStackParamList, 'WorkStatus'>;

export function CollaborationStatusScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { data: collabRes, isLoading: isCollabLoading } = useMyCollaborations();
  const { data: earnings, isLoading: isEarningsLoading } = useCreatorEarnings();
  const { data: profile } = useCreatorProfile();

  if (isCollabLoading || isEarningsLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  const collabs = collabRes?.data || [];

  const needsFilming = collabs.filter(
    (c) =>
      c.status === 'funded' ||
      c.status === 'shipped' ||
      c.status === 'delivered' ||
      c.status === 'revision_requested',
  );
  const inReview = collabs.filter((c) => c.status === 'approved');

  const RAILS = [
    {
      title: t('creator.work.needsFilming', 'Needs filming'),
      count: needsFilming.length,
      cards: needsFilming.map((c) => ({
        id: c.id,
        status: c.status,
        title: (c as any).campaign?.product?.name || (c as any).campaign?.title || t('creator.discover.ugcVideo', 'UGC Video'),
        meta: t('creator.work.amountHeld', 'EGP {{amount}} held', { amount: c.creatorPrice }),
      })),
    },
    {
      title: t('creator.work.inReviewCompleted', 'In review / Completed'),
      count: inReview.length,
      cards: inReview.map((c) => ({
        id: c.id,
        status: c.status,
        title: (c as any).campaign?.product?.name || (c as any).campaign?.title || t('creator.discover.ugcVideo', 'UGC Video'),
        meta: `EGP ${c.creatorPrice}`,
      })),
    },
  ].filter((r) => r.count > 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Row */}
        <AppText variant="displayMd" color="ink">
          {t('creator.work.title', 'Collaborations')}
        </AppText>

        {/* Hero Escrow & Withdrawable Card matching BrandDashboardScreen & BrandProfileScreen */}
        <Card style={styles.escrowCard}>
          <AppText variant="overline" color="muted" style={styles.escrowKicker}>
            {t('creator.work.escrowSummary', 'ESCROW SUMMARY')}
          </AppText>
          <View style={styles.escrowRow}>
            <View style={styles.escrowCol}>
              <AppText variant="titleLg" color="ink" style={styles.tabular}>
                EGP {formatAmount(earnings?.escrowBalance || 0)}
              </AppText>
              <AppText variant="bodySm" color="muted">
                {t('creator.work.heldForYou', 'held for you')}
              </AppText>
            </View>
            <View style={[styles.escrowCol, styles.escrowDivider]}>
              <AppText variant="titleLg" color="ink" style={styles.tabular}>
                EGP {formatAmount(earnings?.pendingBalance || 0)}
              </AppText>
              <AppText variant="bodySm" color="muted">
                {t('creator.work.readyToWithdraw', 'ready to withdraw')}
              </AppText>
            </View>
          </View>
        </Card>

        {RAILS.length === 0 ? (
          <EmptyState
            icon="briefcase"
            title={t('creator.work.emptyActive', 'No active collaborations.')}
            message={t('creator.work.emptyHint', 'Apply to open briefs to start working with brands.')}
          />
        ) : (
          RAILS.map((rail) => (
            <View key={rail.title} style={styles.railSection}>
              <View style={styles.railHeader}>
                <AppText variant="titleSm" color="ink">
                  {rail.title}
                </AppText>
                <View style={styles.railCountPill}>
                  <AppText variant="overline" color="primary" style={styles.tabular}>
                    {rail.count}
                  </AppText>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.railScroll}
              >
                {rail.cards.map((c, i) => (
                  <PressableCard
                    key={c.id || i}
                    style={[styles.card, (c as any).faded && { opacity: 0.5 }]}
                    onPress={() => {
                      if (c.id) {
                        navigation.navigate('DeliverableUpload', { collaborationId: c.id });
                      }
                    }}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardIcon}>
                        <Icon name="video" size={18} color="primary" />
                      </View>
                      <StatusBadge domain="collaboration" status={c.status} />
                    </View>
                    <AppText variant="titleSm" color="ink" style={styles.cardTitle} numberOfLines={2}>
                      {c.title}
                    </AppText>
                    {c.meta ? (
                      <AppText variant="bodySm" color="muted" style={styles.tabular}>
                        {c.meta}
                      </AppText>
                    ) : null}
                  </PressableCard>
                ))}
              </ScrollView>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  escrowCard: {
    borderRadius: radius.xxl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  escrowKicker: {
    letterSpacing: 0.8,
  },
  escrowRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingTop: spacing.md,
  },
  escrowCol: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  escrowDivider: {
    borderStartWidth: StyleSheet.hairlineWidth,
    borderStartColor: colors.hairline,
  },
  railSection: {
    gap: spacing.sm,
  },
  railHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  railCountPill: {
    minWidth: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railScroll: {
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  card: {
    width: 224,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    marginBottom: spacing.xxs,
  },
});
