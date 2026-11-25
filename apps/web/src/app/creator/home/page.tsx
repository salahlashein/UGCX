'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { QueryStateView } from '../../../components/ui';
import { spacing } from '../../../theme/tokens';
import { useConfirmReceipt } from '../../../hooks/api/useCollaborations';
import { useCreatorHomeData } from '../../../hooks/domain';
import { useTranslation } from '../../../i18n';
import {
  CreatorHomeHeader,
  EarningsHeroCard,
  QueueTaskSection,
  RecommendedBriefsGrid,
  ProposalStatusPills,
} from '../../../features/creator/home/components';

export default function CreatorHomePage() {
  const { locale } = useTranslation();
  const confirmReceiptMutation = useConfirmReceipt();
  const data = useCreatorHomeData();

  return (
    <AppShell requiredRole="creator">
      <QueryStateView
        isLoading={data.isInitialLoading}
        isError={data.hasInitialError}
        data={data.creator}
        onRetry={data.combinedState.refetch}
      >
        {() => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
            <CreatorHomeHeader
              creator={data.creator}
              unreadCount={data.unreadCount}
              locale={locale}
            />
            <div
              className="ugcx-split"
              style={
                {
                  gap: spacing.xl,
                  ['--split-main' as string]: '2fr',
                  ['--split-side-min' as string]: '300px',
                } as React.CSSProperties
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                <QueueTaskSection
                  urgentTasks={data.urgentTasks}
                  upcomingTasks={data.upcomingTasks}
                  waitingProposals={data.waitingProposals}
                  isEmpty={data.isEmpty}
                  confirmReceiptPending={confirmReceiptMutation.isPending}
                  onConfirmReceipt={(collabId) => confirmReceiptMutation.mutate(collabId)}
                  locale={locale}
                />
                <RecommendedBriefsGrid briefsForYou={data.briefsForYou} locale={locale} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                <EarningsHeroCard earnings={data.earnings} locale={locale} />
                <ProposalStatusPills proposalCounts={data.proposalCounts} locale={locale} />
              </div>
            </div>
          </div>
        )}
      </QueryStateView>
    </AppShell>
  );
}
