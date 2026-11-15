'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { AppNotification } from '@ugcx/shared-types';
import { AppShell } from '../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  DataTable,
  Icon,
  QueryStateView,
  StatusBadge,
  Tag,
  type DataTableColumn,
} from '../../components/ui';
import { colors, radius, spacing } from '../../theme/tokens';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../../hooks/api/useNotifications';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../i18n';
import { formatAmount, formatDateShort, formatMoney } from '../../utils/format';
import {
  getNotificationActionRoute,
  getNotificationAmount,
  getNotificationCategory,
} from '../../utils/notificationView';

export default function NotificationsPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const role = user?.role === 'creator' ? 'creator' : 'brand';

  const notificationsQuery = useNotifications(false, 1, 100);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.readAt) {
      markRead.mutate(notif.id);
    }
    const route = getNotificationActionRoute(notif, role);
    router.push(route);
  };

  const getCategoryTone = (cat: string) => {
    switch (cat) {
      case 'money':
        return 'done';
      case 'work':
        return 'live';
      case 'proposals':
        return 'pend';
      case 'messages':
        return 'live';
      default:
        return 'muted';
    }
  };

  const columns: DataTableColumn<AppNotification>[] = [
    {
      key: 'when',
      header: locale === 'ar' ? 'الوقت' : 'When',
      render: (notif) => {
        const isUnread = !notif.readAt;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            {isUnread && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.primary,
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 12,
                color: colors.textSecondary,
              }}
            >
              {formatDateShort(notif.createdAt, locale)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: locale === 'ar' ? 'النوع' : 'Type',
      render: (notif) => {
        const cat = getNotificationCategory(notif.event);
        const tone = getCategoryTone(cat);
        return <Tag tone={tone as any}>{cat.toUpperCase()}</Tag>;
      },
    },
    {
      key: 'event',
      header: locale === 'ar' ? 'الحدث' : 'Event',
      render: (notif) => {
        const rolePrefix = role;
        // Money params arrive as raw strings such as "1500.00". Format them
        // before interpolation, so the sentence matches the amount column.
        const MONEY_PARAMS = ['total', 'amount', 'creatorPrice', 'platformFee'];
        const rawParams = (notif.params ?? {}) as Record<string, unknown>;
        const params = Object.fromEntries(
          Object.entries(rawParams).map(([key, value]) =>
            MONEY_PARAMS.includes(key) ? [key, formatAmount(value as string)] : [key, value],
          ),
        );
        const localized = t(`notif.${rolePrefix}.${notif.event}`, notif.event, params as any);
        return (
          <span
            style={{
              fontSize: 13,
              fontWeight: !notif.readAt ? 500 : 400,
              color: colors.textPrimary,
            }}
          >
            {localized}
          </span>
        );
      },
    },
    {
      key: 'amount',
      header: locale === 'ar' ? 'المبلغ' : 'Amount',
      align: 'end',
      render: (notif) => {
        const amount = getNotificationAmount(notif);
        if (!amount) return <span style={{ color: colors.textTertiary }}>-</span>;
        return (
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 500,
              fontSize: 13,
              color: colors.primary,
              direction: 'ltr',
              display: 'inline-block',
            }}
          >
            {formatMoney(amount)}
          </span>
        );
      },
    },
    {
      key: 'action',
      header: '',
      align: 'end',
      render: (notif) => (
        <Button variant="secondary" size="sm" onClick={() => handleNotificationClick(notif)}>
          {locale === 'ar' ? 'فتح' : 'View'} →
        </Button>
      ),
    },
  ];

  return (
    <AppShell requiredRole={role}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <AppText variant="caption" color={colors.textSecondary}>
              {locale === 'ar' ? 'سجل النشاط والتنبيهات' : 'Activity & alerts'}
            </AppText>
            <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
              {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
            </AppText>
          </div>

          <Button
            variant="secondary"
            size="sm"
            loading={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            {locale === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
          </Button>
        </div>

        {/* Notifications Activity Ledger */}
        <QueryStateView
          isLoading={notificationsQuery.isLoading}
          isError={notificationsQuery.isError}
          data={notificationsQuery.data?.data}
          isEmpty={(items) => items.length === 0}
          onRetry={() => notificationsQuery.refetch()}
          emptyTitle={locale === 'ar' ? 'لا توجد إشعارات' : 'Nothing new'}
          emptyMessage={
            locale === 'ar'
              ? 'ستظهر هنا كافة الإشعارات المتعلقة بالبريفات والتعاونات وعمليات الدفع.'
              : 'You will receive notifications here for updates on briefs, collaborations, and transactions.'
          }
        >
          {(items) => (
            <Card elevation="card" style={{ padding: spacing.md, borderRadius: radius.card }}>
              <DataTable
                columns={columns}
                data={items}
                keyExtractor={(item) => item.id}
                onRowClick={(item) => handleNotificationClick(item)}
              />
            </Card>
          )}
        </QueryStateView>
      </div>
    </AppShell>
  );
}
