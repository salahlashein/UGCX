'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { QueryStateView } from '../../../components/ui';
import { spacing } from '../../../theme/tokens';
import { useBrandRole } from '../../../hooks/useBrandRole';
import { useBrandDashboardData } from '../../../hooks/domain';
import { useTranslation } from '../../../i18n';
import {
  DashboardHeader,
  SpendHeroCard,
  PipelineSection,
  BriefsTableSection,
  QuickActionGrid,
} from '../../../features/brand/dashboard/components';
import { useDashboardShortcuts } from '../../../features/brand/dashboard/hooks/useDashboardShortcuts';

export default function BrandDashboardPage() {
  const router = useRouter();
  const { locale } = useTranslation();
  const { can, role } = useBrandRole();
  const isViewer = role === 'viewer';
  const data = useBrandDashboardData(locale);

  useDashboardShortcuts(router, can);

  return (
    <AppShell requiredRole="brand">
      <QueryStateView
        isLoading={data.combinedState.isLoading}
        isError={data.combinedState.isError}
        data={data.dashboard}
        onRetry={data.combinedState.refetch}
      >
        {(dashboard) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
            <DashboardHeader
              brandName={data.brandName}
              initials={data.initials}
              canCreate={!isViewer && can('createBrief')}
              locale={locale}
            />
            <SpendHeroCard
              dashboard={dashboard}
              monthSpend={data.monthSpend}
              monthDeliverables={data.monthDeliverables}
              stillInEscrowCents={data.stillInEscrowCents}
              isViewer={isViewer}
              canCreateBrief={can('createBrief')}
              canFundEscrow={can('fundEscrow')}
              locale={locale}
              onNewBrief={() => router.push('/brand/briefs/new')}
              onFundBrief={() => router.push('/brand/briefs')}
            />
            <BriefsTableSection series={dashboard.series} locale={locale} />
            <PipelineSection stages={data.pipelineStages} locale={locale} />
            <QuickActionGrid
              totalActionItems={data.totalActionItems}
              proposalsAlert={data.proposalsAlert}
              deliverablesAlert={data.deliverablesAlert}
              unfundedDrafts={data.unfundedDrafts}
              isViewer={isViewer}
              canCreateBrief={can('createBrief')}
              canFundEscrow={can('fundEscrow')}
              canViewBilling={can('viewBilling')}
              locale={locale}
            />
          </div>
        )}
      </QueryStateView>
    </AppShell>
  );
}
