'use client';

import { useMemo } from 'react';
import type { BrandDashboard, BriefListItem } from '@ugcx/shared-types';
import { useBrandDashboard } from '../api/useDashboard';
import { useMyBriefs } from '../api/useCampaigns';
import { combineQueries, type CombinedQueryResult } from '../../utils/queryAggregator';
import {
  calculateStillInEscrowCents,
  groupBriefsByPipelineStage,
} from '../../utils/dashboardMetrics';
import { toCents } from '../../utils/money';
import { getInitials } from '../../utils/format';
import type { Locale } from '../../i18n';
import type { PipelineStage } from '../../components/ui';

export interface UseBrandDashboardDataResult {
  dashboard: BrandDashboard | undefined;
  briefs: BriefListItem[];
  stillInEscrowCents: number;
  pipelineStages: PipelineStage[];
  unfundedDrafts: BriefListItem[];
  totalActionItems: number;
  proposalsAlert: number;
  deliverablesAlert: number;
  monthSpend: string;
  monthDeliverables: number;
  brandName: string;
  initials: string;
  combinedState: CombinedQueryResult;
}

export function useBrandDashboardData(locale: Locale = 'en'): UseBrandDashboardDataResult {
  const dashboardQuery = useBrandDashboard();
  const myBriefsQuery = useMyBriefs({ perPage: 100 });

  const briefs = myBriefsQuery.data?.data || [];
  const dashboard = dashboardQuery.data;

  const stillInEscrowCents = useMemo(() => {
    return calculateStillInEscrowCents(briefs);
  }, [briefs]);

  const pipelineStages = useMemo(() => {
    return groupBriefsByPipelineStage(briefs, locale);
  }, [briefs, locale]);

  const unfundedDrafts = useMemo(() => {
    return briefs.filter((b) => b.status === 'draft' && toCents(b.escrowFundedAmount) === 0);
  }, [briefs]);

  const proposalsAlert = dashboard?.attention?.briefsNeedingProposalReview ?? 0;
  const deliverablesAlert = dashboard?.attention?.deliverablesAwaitingReview ?? 0;
  const monthSpend = dashboard?.month?.spend ?? '0.00';
  const monthDeliverables = dashboard?.month?.deliverableCount ?? 0;

  const totalActionItems =
    (proposalsAlert > 0 ? 1 : 0) + (deliverablesAlert > 0 ? 1 : 0) + unfundedDrafts.length;

  const brandName = dashboard?.brandName || 'Brand Workspace';
  const initials = getInitials(brandName, 'BW');

  const combinedState = combineQueries(dashboardQuery, myBriefsQuery);

  return {
    dashboard,
    briefs,
    stillInEscrowCents,
    pipelineStages,
    unfundedDrafts,
    totalActionItems,
    proposalsAlert,
    deliverablesAlert,
    monthSpend,
    monthDeliverables,
    brandName,
    initials,
    combinedState,
  };
}
