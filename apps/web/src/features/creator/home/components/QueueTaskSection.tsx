'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Proposal } from '@ugcx/shared-types';
import type { HomeTask } from '../../../../hooks/api/useHomeQueue';
import { AppText, Button, Card, Icon } from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import { UrgentTasksCard } from './UrgentTasksCard';
import { ComingUpCard } from './ComingUpCard';
import type { Locale } from '../../../../i18n';

export interface QueueTaskSectionProps {
  urgentTasks: HomeTask[];
  upcomingTasks: HomeTask[];
  waitingProposals: Proposal[];
  isEmpty: boolean;
  confirmReceiptPending: boolean;
  onConfirmReceipt: (collabId: string) => void;
  locale: Locale;
}

export function QueueTaskSection({
  urgentTasks,
  upcomingTasks,
  waitingProposals,
  isEmpty,
  confirmReceiptPending,
  onConfirmReceipt,
  locale,
}: QueueTaskSectionProps) {
  const router = useRouter();
  const isAr = locale === 'ar';

  return (
    <>
      <UrgentTasksCard
        urgentTasks={urgentTasks}
        confirmReceiptPending={confirmReceiptPending}
        onConfirmReceipt={onConfirmReceipt}
        locale={locale}
      />
      <ComingUpCard
        upcomingTasks={upcomingTasks}
        waitingProposals={waitingProposals}
        confirmReceiptPending={confirmReceiptPending}
        onConfirmReceipt={onConfirmReceipt}
        locale={locale}
      />
      {isEmpty && (
        <Card elevation="card" style={{ padding: spacing.xl, borderRadius: radius.card, textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.md }}>
            <div style={{ width: 48, height: 48, borderRadius: radius.card, backgroundColor: colors.accentSoft, color: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={24} />
            </div>
            <AppText variant="subtitle" style={{ fontWeight: 500, color: colors.textPrimary }}>
              {isAr ? 'لا توجد مهام حالية' : 'Nothing to do now'}
            </AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              {isAr
                ? 'استكشف البريفات المتاحة وقدم عروضك للبدء في مشاريع جديدة.'
                : 'Explore live briefs and submit proposals to start new collaborations.'}
            </AppText>
            <Button variant="primary" onClick={() => router.push('/creator/discover')}>
              {isAr ? 'تصفح البريفات' : 'Browse briefs'}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
