'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { HomeTask } from '../../../../hooks/api/useHomeQueue';
import { AppText, Button, Card, ListRow, Tag } from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import { formatDueDate } from '../../../../utils/format';
import { taskToWebRoute } from '../../../../utils/taskRoute';
import type { Locale } from '../../../../i18n';

interface UrgentTasksCardProps {
  urgentTasks: HomeTask[];
  confirmReceiptPending: boolean;
  onConfirmReceipt: (collabId: string) => void;
  locale: Locale;
}

export function UrgentTasksCard({
  urgentTasks,
  confirmReceiptPending,
  onConfirmReceipt,
  locale,
}: UrgentTasksCardProps) {
  const router = useRouter();
  const isAr = locale === 'ar';

  if (urgentTasks.length === 0) return null;

  return (
    <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <AppText variant="subtitle" style={{ fontWeight: 500, color: colors.textPrimary }}>
            {isAr ? 'مهام عاجلة الآن' : 'Do now'}
          </AppText>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono, monospace)', color: colors.danger, fontWeight: 500 }}>
            ({urgentTasks.length})
          </span>
        </div>
        <AppText variant="caption" color={colors.textSecondary}>
          {isAr ? 'مرتب حسب الموعد النهائي' : 'Sorted by deadline'}
        </AppText>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {urgentTasks.map((t) => {
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
                    <Tag tone="danger">
                      {isAr ? `استحقاق: ${formatDueDate(t.dueAt, locale)}` : `Due: ${formatDueDate(t.dueAt, locale)}`}
                    </Tag>
                  )}
                  {isShipment ? (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={confirmReceiptPending}
                      onClick={() => onConfirmReceipt(collabId)}
                    >
                      {confirmReceiptPending
                        ? isAr ? 'جاري التأكيد...' : 'Confirming...'
                        : isAr ? 'تأكيد استلام المنتج' : 'Confirm product received'}
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => router.push(taskToWebRoute(t))}>
                      {t.actionText || (isAr ? 'إجراء' : 'Act')}
                    </Button>
                  )}
                </div>
              }
            />
          );
        })}
      </div>
    </Card>
  );
}
