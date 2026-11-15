import React from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CreatorHomeStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { Card, PressableCard } from '../../components/ui/Card';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Icon, type IconName } from '../../components/ui/Icon';
import { colors, spacing, radius } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';
import { useCreatorProfile } from '../../hooks/api/useCreator';
import { useHomeQueue, HomeTask } from '../../hooks/api/useHomeQueue';
import { useUnreadCount } from '../../hooks/api/useNotifications';
import { formatCount, initialsOf } from '../../utils/format';
import { navigationRef } from '../../navigation/navigationRef';

type Props = NativeStackScreenProps<CreatorHomeStackParamList, 'Home'>;

interface QuickActionProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  badge?: number;
  primary?: boolean;
  testID?: string;
}

function QuickAction({ icon, label, onPress, badge = 0, primary, testID }: QuickActionProps) {
  return (
    <View style={styles.action}>
      <PressableCard
        testID={testID}
        accessibilityLabel={label}
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

export function CreatorHomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { data: profile, isLoading: isProfileLoading } = useCreatorProfile();
  const { data: queue, isLoading: isQueueLoading } = useHomeQueue();
  const { data: unread } = useUnreadCount();

  const targetNav = (navigation.getParent() || navigationRef) as any;

  const handleAction = (task: HomeTask) => {
    if (task.actionUrl.startsWith('/upload')) {
      targetNav.navigate('WorkTab', {
        screen: 'DeliverableUpload',
        params: { collaborationId: task.collaborationId, id: task.collaborationId },
      });
    } else if (task.actionUrl.startsWith('/chat')) {
      targetNav.navigate('WorkTab', {
        screen: 'CollaborationChat',
        params: { collaborationId: task.collaborationId, id: task.collaborationId },
      });
    } else {
      targetNav.navigate('WorkTab', { screen: 'WorkStatus' });
    }
  };

  if (isProfileLoading || isQueueLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  const initials = profile?.displayName ? initialsOf(profile.displayName) : 'U';
  const urgentCount = queue?.urgentTasks?.length || 0;
  const upcomingCount = queue?.upcomingTasks?.length || 0;
  const totalCount = urgentCount + upcomingCount;

  const formatNiche = (niche?: string) => {
    if (!niche) return t('creator.profile.niches', 'Niche');
    return t(`niche.${niche}`, niche);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header matching BrandDashboardScreen */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <AppText variant="label" color="onPrimary">
              {initials}
            </AppText>
          </View>
          <View style={styles.headerText}>
            <AppText variant="bodySm" color="muted">
              {profile?.city || t('creator.profile.city', 'City')} · {formatNiche(profile?.niches?.[0])}
            </AppText>
            <AppText variant="titleSm" color="ink" numberOfLines={1}>
              {profile?.displayName || t('creator.profile.title', 'Creator')}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('brand.dashboard.notifications', 'Notifications')}
            testID="notifications-bell-btn"
            onPress={() => navigation.navigate('Notifications')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Icon name="bell" size={20} color="ink" />
            {unread && unread.unread > 0 ? <View style={styles.bellDot} /> : null}
          </Pressable>
        </View>

        {/* Hero summary card matching BrandDashboardScreen spendCard */}
        <Card style={styles.heroCard}>
          <AppText variant="bodySm" color="muted">
            {totalCount > 0
              ? t('creator.home.thingsNeedYou', '{{count}} things need you', { count: totalCount })
              : t('creator.home.allCaughtUp', 'All caught up!')}
          </AppText>
          <View style={styles.metricRow}>
            <AppText variant="metric" color="ink" style={styles.tabular}>
              {formatCount(totalCount)}
            </AppText>
            <AppText variant="caption" color="muted">
              {t('creator.home.tasks', 'tasks')}
            </AppText>
          </View>
          <View style={styles.heroMeta}>
            <Icon name="video" size={14} color="primary" />
            <AppText variant="bodySm" color="muted" style={styles.tabular}>
              {totalCount > 0
                ? t('creator.home.urgentAndUpcoming', '{{urgent}} urgent tasks and {{upcoming}} upcoming.', {
                    urgent: urgentCount,
                    upcoming: upcomingCount,
                  })
                : t('creator.home.noUrgentTasks', 'No urgent tasks for now.')}
            </AppText>
          </View>
        </Card>

        {/* Quick actions matching BrandDashboardScreen */}
        <View style={styles.actions}>
          <QuickAction
            primary
            icon="search"
            label={t('nav.discover', 'Discover')}
            onPress={() => targetNav.navigate('DiscoverTab', { screen: 'Discover' })}
            testID="quick-action-discover"
          />
          <QuickAction
            icon="briefcase"
            label={t('nav.work', 'Work')}
            badge={urgentCount}
            onPress={() => targetNav.navigate('WorkTab', { screen: 'WorkStatus' })}
            testID="quick-action-work"
          />
          <QuickAction
            icon="inbox"
            label={t('creator.home.actionProposals', 'Proposals')}
            onPress={() => targetNav.navigate('ProfileTab', { screen: 'MyProposals' })}
            testID="quick-action-proposals"
          />
          <QuickAction
            icon="credit-card"
            label={t('nav.earnings', 'Earnings')}
            onPress={() => targetNav.navigate('EarningsTab', { screen: 'Earnings' })}
            testID="quick-action-earnings"
          />
        </View>

        {/* Urgent Tasks */}
        {urgentCount > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <AppText variant="titleSm" color="ink">
                {t('creator.home.urgentActions', 'Urgent actions ({{count}})', { count: urgentCount })}
              </AppText>
            </View>
            {queue?.urgentTasks?.map((task) => (
              <Card key={task.id} style={styles.urgentCard}>
                <View style={styles.urgentTop}>
                  <View style={styles.urgentIcon}>
                    <Icon name="alert-circle" size={18} color="primary" />
                  </View>
                  <View style={styles.urgentText}>
                    <AppText variant="overline" color="primary">
                      {t('creator.home.urgentTag', 'URGENT')}
                    </AppText>
                    <AppText variant="titleSm" color="ink">
                      {task.title}
                    </AppText>
                  </View>
                </View>
                <AppText variant="body" color="body" style={styles.urgentBody}>
                  {task.description}
                </AppText>
                <Button
                  title={task.actionText}
                  variant="primary"
                  onPress={() => handleAction(task)}
                />
              </Card>
            ))}
          </>
        )}

        {/* Upcoming Tasks */}
        <View style={styles.sectionHeader}>
          <AppText variant="titleSm" color="ink">
            {t('creator.home.upcomingQueue', 'Upcoming queue ({{count}})', { count: upcomingCount })}
          </AppText>
        </View>

        {upcomingCount === 0 && urgentCount === 0 ? (
          <EmptyState
            icon="briefcase"
            title={t('creator.home.queueClear', 'Queue is clear')}
            message={t('creator.home.queueClearSub', 'Browse open briefs to pitch your next collaboration.')}
            action={{
              label: t('creator.home.actionFindBriefs', 'Find briefs'),
              onPress: () => targetNav.navigate('DiscoverTab', { screen: 'Discover' }),
            }}
          />
        ) : upcomingCount > 0 ? (
          <Card style={styles.queueCard}>
            {queue?.upcomingTasks?.map((task, index) => (
              <Pressable
                key={task.id}
                accessibilityRole="button"
                onPress={() => handleAction(task)}
                style={({ pressed }) => [
                  styles.queueRow,
                  index > 0 && styles.queueDivider,
                  pressed && styles.queuePressed,
                ]}
              >
                <View style={styles.rowIcon}>
                  <Icon
                    name={task.actionUrl.startsWith('/chat') ? 'message-circle' : 'video'}
                    size={18}
                    color="primary"
                  />
                </View>
                <View style={styles.rowInfo}>
                  <AppText variant="label" color="ink" numberOfLines={1}>
                    {task.title}
                  </AppText>
                  <AppText variant="bodySm" color="muted" numberOfLines={1}>
                    {task.description}
                  </AppText>
                </View>
                <Icon name="chevron-right" size={18} color="borderStrong" directional />
              </Pressable>
            ))}
          </Card>
        ) : null}
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
  bellDot: {
    position: 'absolute',
    top: 10,
    end: 11,
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.xxl,
    marginTop: spacing.xs,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  heroMeta: {
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
  urgentCard: {
    gap: spacing.sm,
  },
  urgentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  urgentIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentText: {
    flex: 1,
  },
  urgentBody: {
    marginBottom: spacing.xxs,
  },
  queueCard: {
    padding: 0,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  queueDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  queuePressed: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.xl,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
  },
});
