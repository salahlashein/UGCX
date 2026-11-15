'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppText, Button, Card, ListRow, Tag } from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import { plural } from '../../../../utils/labels';
import type { Locale } from '../../../../i18n';

interface ActionListCardProps {
  totalActionItems: number;
  proposalsAlert: number;
  deliverablesAlert: number;
  unfundedDrafts: Array<{ id: string; title: string }>;
  isViewer: boolean;
  canFundEscrow: boolean;
  locale: Locale;
}

export function ActionListCard({
  totalActionItems,
  proposalsAlert,
  deliverablesAlert,
  unfundedDrafts,
  isViewer,
  canFundEscrow,
  locale,
}: ActionListCardProps) {
  const router = useRouter();
  const isAr = locale === 'ar';

  return (
    <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <AppText variant="subtitle" style={{ fontWeight: 500, color: colors.textPrimary }}>
            {isAr ? 'يحتاج إلى إجراء' : 'Needs your action'}
          </AppText>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono, monospace)', color: colors.textSecondary }}>
            ({totalActionItems})
          </span>
        </div>
      </div>

      {totalActionItems === 0 ? (
        <div style={{ padding: spacing.md, textAlign: 'center' }}>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            {isAr ? 'لا توجد إجراءات معلقة حالياً' : 'All caught up! No urgent actions.'}
          </AppText>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {proposalsAlert > 0 && (
            <ListRow
              title={isAr ? 'عروض بحاجة للمراجعة' : 'Proposals awaiting review'}
              subtitle={
                isAr
                  ? `${proposalsAlert} بريف يحتوي على عروض جديدة`
                  : `${plural(proposalsAlert, 'brief has', 'briefs have')} new creator proposals`
              }
              tag={<Tag tone="danger">{isAr ? 'عاجل' : 'Urgent'}</Tag>}
              action={
                <Button variant="secondary" size="sm" onClick={() => router.push('/brand/proposals')}>
                  {isAr ? 'عرض العروض' : 'Review'}
                </Button>
              }
            />
          )}

          {deliverablesAlert > 0 && (
            <ListRow
              title={isAr ? 'فيديوهات بانتظار المراجعة' : 'Deliverables awaiting review'}
              subtitle={
                isAr
                  ? `${deliverablesAlert} فيديو جاهز للمعاينة والموافقة`
                  : `${plural(deliverablesAlert, 'video is', 'videos are')} ready for review`
              }
              tag={<Tag tone="danger">{isAr ? 'عاجل' : 'Urgent'}</Tag>}
              action={
                <Button variant="secondary" size="sm" onClick={() => router.push('/brand/briefs')}>
                  {isAr ? 'معاينة' : 'Review'}
                </Button>
              }
            />
          )}

          {unfundedDrafts.map((draft) => (
            <ListRow
              key={draft.id}
              title={draft.title}
              subtitle={isAr ? 'مسودة بريف غير ممولة' : 'Draft brief pending escrow funding'}
              action={
                !isViewer && canFundEscrow ? (
                  <Button variant="secondary" size="sm" onClick={() => router.push(`/brand/briefs/${draft.id}`)}>
                    {isAr ? 'تمويل' : 'Fund'}
                  </Button>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
    </Card>
  );
}
