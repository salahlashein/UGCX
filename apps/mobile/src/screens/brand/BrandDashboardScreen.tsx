import React from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { useBrandDashboard } from '../../hooks/api/useDashboard';
import { AppText } from '../../components/ui/Text';
import { Card, PressableCard } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Icon, type IconName } from '../../components/ui/Icon';
import { colors, radius, spacing } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';
import { formatAmount, formatCount, initialsOf } from '../../utils/format';

function greetingKey(hour: number): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  if (hour < 12) return 'greetingMorning';
  if (hour < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

interface QuickActionProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  badge?: number;
  accessibilityLabel?: string;
  primary?: boolean;
  testID?: string;
}

function QuickAction({ icon, label, onPress, badge = 0, accessibilityLabel, primary, testID }: QuickActionProps) {
  return (
    <View style={styles.action}>
      <PressableCard
        testID={testID}
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={onPress}
        style={[styles.actionTile, primary && styles.actionTilePrimary]}
      >
        <Icon name={icon} size={22} color={primary ? 'onPrimary' : 'ink'} />
        {badge > 0 && (
          <View style={styles.badge}>
            <AppText variant="overline" color="onPrimary" style={styles.badgeText}>
              {badge > 99 ? '99+' : formatCount(badge)}
            </AppText>
          </View>
        )}
      </PressableCard>
      <AppText variant="bodySm" color="ink" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

/**
 * TASK-P3-11: Brand Dashboard Screen (Artboard 3g).
 * 2026-10-03 redesign ("S2 quick actions" in the C3 sage palette):
 * header, spend card, quick actions with attention badges, active briefs.
 */
export function BrandDashboardScreen() {
  const { t } = useTranslation();
  // Cross-tab targets (Briefs, Proposals, Profile), so the base param list is used.
  const nav = useNavigation<NavigationProp<ParamListBase>>();
  const { data, isLoading, isError, error, refetch, isRefetching } = useBrandDashboard();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState
          title={t('common.error.title', 'Error')}
          message={(error as Error)?.message ?? t('common.error.generic')}
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  const { brandName, logoUrl, month, attention, activeBriefs, activeBriefCount } = data;

  const initials = brandName ? initialsOf(brandName) : 'B';

  const formattedSpend = formatAmount(month.spend || 0);

  const goToBriefs = () => nav.navigate('BrandBriefsTab', { screen: 'MyBriefs' });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logoImage} accessibilityIgnoresInvertColors />
            ) : (
              <AppText variant="label" color="onPrimary">
                {initials}
              </AppText>
            )}
          </View>
          <View style={styles.headerText}>
            <AppText variant="bodySm" color="muted">
              {t(`brand.dashboard.${greetingKey(new Date().getHours())}`)}
            </AppText>
            <AppText variant="titleSm" color="ink" numberOfLines={1}>
              {brandName || t('brand.dashboard.welcome', 'Brand Dashboard')}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('brand.dashboard.notifications', 'Notifications')}
            testID="notifications-bell-btn"
            onPress={() => nav.navigate('Notifications')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Icon name="bell" size={20} color="ink" />
          </Pressable>
        </View>

        {/* Spend card */}
        <Card style={styles.spendCard}>
          <AppText variant="bodySm" color="muted">
            {t('brand.dashboard.spentThisMonth', 'Spent this month')}
          </AppText>
          <View style={styles.spendRow}>
            <AppText variant="metric" color="ink" style={styles.tabular}>
              {formattedSpend}
            </AppText>
            <AppText variant="caption" color="muted">
              {month.currency}
            </AppText>
          </View>
          <View style={styles.spendMeta}>
            <Icon name="video" size={14} color="primary" />
            <AppText variant="bodySm" color="muted" style={styles.tabular}>
              {t('brand.dashboard.deliverablesReceived', '{{count}} deliverables received', {
                count: month.deliverableCount,
              })}
            </AppText>
          </View>
        </Card>

        {/* Quick actions */}
        <View style={styles.actions}>
          <QuickAction
            primary
            icon="plus"
            label={t('brand.dashboard.actionNewBrief', 'New brief')}
            onPress={() => nav.navigate('BrandBriefsTab', { screen: 'PostBrief' })}
            testID="quick-action-new-brief"
          />
          <QuickAction
            icon="inbox"
            label={t('brand.dashboard.actionProposals', 'Proposals')}
            badge={attention.briefsNeedingProposalReview}
            accessibilityLabel={
              attention.briefsNeedingProposalReview > 0
                ? t('brand.dashboard.attentionProposals', '{{count}} briefs need proposal review', {
                    count: attention.briefsNeedingProposalReview,
                  })
                : undefined
            }
            onPress={() => nav.navigate('BrandProposalsTab', { screen: 'ProposalsAcrossBriefs' })}
            testID="quick-action-proposals"
          />
          <QuickAction
            icon="play-circle"
            label={t('brand.dashboard.actionReview', 'Review')}
            badge={attention.deliverablesAwaitingReview}
            accessibilityLabel={
              attention.deliverablesAwaitingReview > 0
                ? t('brand.dashboard.attentionDeliverables', '{{count}} deliverables awaiting review', {
                    count: attention.deliverablesAwaitingReview,
                  })
                : undefined
            }
            onPress={goToBriefs}
            testID="quick-action-review"
          />
          <QuickAction
            icon="credit-card"
            label={t('brand.dashboard.actionWallet', 'Wallet')}
            onPress={() => nav.navigate('BrandProfileTab', { screen: 'BrandBilling' })}
            testID="quick-action-wallet"
          />
        </View>

        {/* Active briefs */}
        <View style={styles.sectionHeader}>
          <AppText variant="titleSm" color="ink">
            {t('brand.dashboard.activeBriefs', 'Active briefs ({{count}})', { count: activeBriefCount })}
          </AppText>
          {activeBriefs.length > 0 && (
            <Pressable accessibilityRole="link" onPress={goToBriefs} hitSlop={12}>
              <AppText variant="bodySm" color="link">
                {t('brand.dashboard.seeAll', 'See all')}
              </AppText>
            </Pressable>
          )}
        </View>

        {activeBriefs.length === 0 ? (
          <EmptyState
            title={t('brand.briefs.empty.title', 'No briefs yet')}
            message={t('brand.briefs.empty.message', 'Post your first brief to start getting proposals.')}
            action={{
              label: t('brand.briefs.empty.action', 'New brief'),
              onPress: () => nav.navigate('BrandBriefsTab', { screen: 'PostBrief' }),
            }}
          />
        ) : (
          <Card style={styles.briefsCard}>
            {activeBriefs.map((brief, index) => (
              <Pressable
                key={brief.id}
                accessibilityRole="button"
                onPress={() =>
                  nav.navigate('BrandBriefsTab', {
                    screen: 'ProposalsInbox',
                    params: { campaignId: brief.id },
                  })
                }
                style={({ pressed }) => [
                  styles.briefRow,
                  index > 0 && styles.briefDivider,
                  pressed && styles.briefPressed,
                ]}
              >
                <View style={styles.briefIcon}>
                  <Icon name="file-text" size={18} color="primary" />
                </View>
                <View style={styles.briefInfo}>
                  <AppText variant="label" color="ink" numberOfLines={1}>
                    {brief.title}
                  </AppText>
                  <AppText variant="bodySm" color="muted" numberOfLines={1}>
                    {brief.meta}
                  </AppText>
                </View>
                <StatusBadge
                  status={brief.collaborationStatus || brief.status}
                  domain={brief.collaborationStatus ? 'collaboration' : 'campaign'}
                />
              </Pressable>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const TILE = 56;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  headerText: {
    flex: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.soft,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  spendCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.xxl,
    marginTop: spacing.xs,
  },
  spendRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  spendMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxs,
  },
  action: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 72,
  },
  actionTile: {
    width: TILE,
    height: TILE,
    padding: 0,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTilePrimary: {
    backgroundColor: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    end: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  briefsCard: {
    padding: 0,
  },
  briefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  briefDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  briefPressed: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.xl,
  },
  briefIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefInfo: {
    flex: 1,
  },
});
