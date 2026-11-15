import React from 'react';
import {
  StyleSheet,
  View,
  SectionList,
  Pressable,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../hooks/api/useNotifications';
import { ALLOWED_DEEP_LINKS } from '../../hooks/usePushRegistration';
import { AppText } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { BackButton } from '../../components/ui/BackButton';
import { colors, spacing, radius } from '../../theme/tokens';
import { formatRelativeTime } from '../../utils/date';
import type { AppNotification } from '@ugcx/shared-types';

interface NotificationSection {
  title: string;
  data: AppNotification[];
}

function getDayHeader(isoString: string, t: (key: string) => string): string {
  const date = new Date(isoString);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return t('notif.today');

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return t('notif.yesterday');

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }).toUpperCase();
}

function groupNotificationsByDay(
  notifications: AppNotification[],
  t: (key: string) => string,
): NotificationSection[] {
  const map = new Map<string, AppNotification[]>();

  for (const notif of notifications) {
    const key = getDayHeader(notif.createdAt, t);
    const existing = map.get(key) ?? [];
    existing.push(notif);
    map.set(key, existing);
  }

  return Array.from(map.entries()).map(([title, data]) => ({
    title,
    data,
  }));
}

/**
 * TASK-P4-08: Notifications screen matching Artboard 4b and creator screen 15.
 * Serves both brand and creator roles, dynamic day grouping, unread dots,
 * and deep link navigation via the allowed routes catalog.
 */
export function NotificationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);

  const { data: notifsResponse, isLoading, isError, refetch, isRefetching } = useNotifications(false, 1, 30);
  const { data: unreadData } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notifsResponse?.data ?? [];
  const unreadCount = unreadData?.unread ?? 0;

  const handlePressItem = async (item: AppNotification) => {
    if (!item.readAt) {
      markRead.mutate(item.id);
    }

    if (item.deepLink) {
      const { stack, screen, params } = item.deepLink;
      const allowedScreens = ALLOWED_DEEP_LINKS[stack];
      if (allowedScreens && allowedScreens.includes(screen)) {
        navigation.dispatch(
          CommonActions.navigate({
            name: stack,
            params: { screen, params },
          }),
        );
      }
    } else if (item.collaborationId) {
      const stack = user?.role === 'brand' ? 'BriefsTab' : 'WorkTab';
      const screen = user?.role === 'brand' ? 'CollaborationDetail' : 'WorkStatus';
      navigation.dispatch(
        CommonActions.navigate({
          name: stack,
          params: { screen, params: { id: item.collaborationId } },
        }),
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <View style={styles.headerBar}>
          <AppText variant="titleSm" color="ink">{t('notif.title')}</AppText>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonRow} />
          <View style={styles.skeletonRow} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.screen}>
        <ErrorState onRetry={() => refetch()} />
      </View>
    );
  }

  const sections = groupNotificationsByDay(notifications, t);

  // Unread dot color: ink for brand (artboard 4b), coral for creator (screen 15)
  const dotColor = user?.role === 'brand' ? colors.ink : colors.signatureCoral;
  const copyPrefix = user?.role === 'brand' ? 'notif.brand.' : 'notif.creator.';

  return (
    <View style={styles.screen}>
      <View style={styles.headerBar}>
        <BackButton testID="notif-back-btn" onPress={() => navigation.goBack()} />
        <AppText variant="titleSm" color="ink" style={{ flex: 1 }}>{t('notif.title')}</AppText>
        {unreadCount > 0 && (
          <TouchableOpacity
            testID="mark-all-read-btn"
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <AppText variant="caption" color="muted">
              {t('notif.header.markAllRead')}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {sections.length === 0 ? (
        <EmptyState
          icon="bell"
          title={t('notif.empty.title')}
          message={t('notif.empty.message')}
        />
      ) : (
        <SectionList
          contentContainerStyle={styles.listContent}
          sections={sections}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.ink}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeaderWrap}>
              <AppText variant="overline" color="muted" style={styles.sectionHeader}>
                {section.title}
              </AppText>
            </View>
          )}
          renderSectionFooter={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item, index, section }) => {
            const isUnread = !item.readAt;
            const isLast = index === section.data.length - 1;
            // Older rows lack currency and creatorPrice, so fill them in before the copy renders.
            const copyParams: Record<string, unknown> = { currency: 'EGP', ...item.params };
            if (copyParams.creatorPrice == null && copyParams.total != null) {
              copyParams.creatorPrice = copyParams.total;
            }
            const text = t(copyPrefix + item.event, copyParams);
            const timeAgo = formatRelativeTime(item.createdAt);

            return (
              <View style={[styles.cardWrapper, index === 0 && styles.firstRow, isLast && styles.lastRow]}>
                <Pressable
                  testID={`notif-item-${item.id}`}
                  style={({ pressed }) => [
                    styles.row,
                    !isLast && styles.rowBorder,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => handlePressItem(item)}
                >
                  <View
                    testID={`unread-dot-${item.id}`}
                    style={[
                      styles.dot,
                      { backgroundColor: dotColor, opacity: isUnread ? 1 : 0 },
                    ]}
                  />
                  <View style={styles.textContent}>
                    <AppText
                      variant="body"
                      color={isUnread ? 'ink' : 'body'}
                      style={styles.notifText}
                    >
                      {text}
                    </AppText>
                    <AppText variant="caption" color="muted" style={styles.metaText}>
                      {timeAgo}
                    </AppText>
                  </View>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  headerBar: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.canvas,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xs,
  },
  sectionHeaderWrap: {
    paddingVertical: spacing.sm,
  },
  sectionHeader: {
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  cardWrapper: {
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  firstRow: {
    borderTopStartRadius: radius.md,
    borderTopEndRadius: radius.md,
  },
  lastRow: {
    borderBottomStartRadius: radius.md,
    borderBottomEndRadius: radius.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowPressed: {
    backgroundColor: colors.surfaceSoft,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    marginTop: 6,
  },
  textContent: {
    flex: 1,
  },
  notifText: {
    lineHeight: 20,
  },
  metaText: {
    marginTop: spacing.xxs,
  },
  skeletonRow: {
    height: 56,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
});
