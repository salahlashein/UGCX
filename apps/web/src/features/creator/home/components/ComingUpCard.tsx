'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Proposal } from '@ugcx/shared-types';
import type { HomeTask } from '../../../../hooks/api/useHomeQueue';
import { AppText, Button, Card, ListRow, Tag } from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import { formatDueDate, formatMoney } from '../../../../utils/format';
import { taskToWebRoute } from '../../../../utils/taskRoute';
import type { Locale } from '../../../../i18n';

interface ComingUpCardProps {
  upcomingTasks: HomeTask[];
  waitingProposals: Proposal[];
  confirmReceiptPending: boolean;
  onConfirmReceipt: (collabId: string) => void;
  locale: Locale;
}

export function ComingUpCard({
  upcomingTasks,
  waitingProposals,
  confirmReceiptPending,
  onConfirmReceipt,
  locale,
}: ComingUpCardProps) {
  const router = useRouter();
  const isAr = locale === 'ar';

  if (upcomingTasks.length === 0 && waitingProposals.length === 0) return null;

  return (
    <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <AppText variant="subtitle" style={{ fontWeight: 500, color: colors.textPrimary }}>
            {isAr ? 'المهام القادمة والمتابعات' : 'Coming up'}
          </AppText>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono, monospace)', color: colors.textSecondary }}>
            ({upcomingTasks.length + waitingProposals.length})
          </span>
        </div>
        <AppText variant="caption" color={colors.textSecondary}>
          {isAr ? 'مرتب حسب الموعد النهائي' : 'Sorted by deadline'}
        </AppText>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {upcomingTasks.map((t) => {
          const isShipment = t.kind === 'awaiting_shipment' || t.id.startsWith('awaiting_shipment');
          const collabId = t.actionUrl?.split('/').pop() || t.id.replace('awaiting_shipment:', '');

          return (
            <ListRow
              key={t.id}
              title={t.title}
              subtitle={t.description}
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                  {t.dueAt && (
                    <Tag tone="pend">
                      {isAr ? `استحقاق: ${formatDueDate(t.dueAt, locale)}` : `Due: ${formatDueDate(t.dueAt, locale)}`}
                    </Tag>
                  )}
                  {isShipment ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={confirmReceiptPending}
                      onClick={() => onConfirmReceipt(collabId)}
                    >
                      {confirmReceiptPending
                        ? isAr ? 'جاري التأكيد...' : 'Confirming...'
                        : isAr ? 'تأكيد استلام المنتج' : 'Confirm product received'}
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => router.push(taskToWebRoute(t))}>
                      {t.actionText || (isAr ? 'فتح' : 'Open')}
                    </Button>
                  )}
                </div>
              }
            />
          );
        })}

        {waitingProposals.map((p) => (
          <ListRow
            key={p.id}
            title={p.campaign?.title || (isAr ? 'عرض مقدم' : 'Submitted proposal')}
            subtitle={`${isAr ? 'في انتظار رد العلامة التجارية' : 'Waiting for brand reply'} · ${formatMoney(p.price)}`}
            action={
              <Button variant="secondary" size="sm" onClick={() => router.push('/creator/proposals')}>
                {isAr ? 'التفاصيل' : 'Details'}
              </Button>
            }
          />
        ))}
      </div>
    </Card>
  );
}
