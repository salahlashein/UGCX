'use client';

import { useMemo } from 'react';
import type { Campaign, Creator, CreatorEarnings, Proposal } from '@ugcx/shared-types';
import { useCreatorProfile, useCreatorEarnings } from '../api/useCreator';
import { useHomeQueue, type HomeTask } from '../api/useHomeQueue';
import { useUnreadCount } from '../api/useNotifications';
import { useLiveCampaigns } from '../api/useCampaigns';
import { useMyProposals } from '../api/useProposals';
import { combineQueries, type CombinedQueryResult } from '../../utils/queryAggregator';
import { tallyProposalStatuses, type ProposalStatusTally } from '../../utils/proposalAggregator';

export interface UseCreatorHomeDataResult {
  creator: Creator | undefined;
  earnings: CreatorEarnings | undefined;
  unreadCount: number;
  urgentTasks: HomeTask[];
  upcomingTasks: HomeTask[];
  waitingProposals: Proposal[];
  proposalCounts: ProposalStatusTally & { all: Proposal[] };
  briefsForYou: Campaign[];
  isEmpty: boolean;
  combinedState: CombinedQueryResult;
  isInitialLoading: boolean;
  hasInitialError: boolean;
}

export function useCreatorHomeData(): UseCreatorHomeDataResult {
  const profileQuery = useCreatorProfile();
  const earningsQuery = useCreatorEarnings();
  const queueQuery = useHomeQueue();
  const unreadQuery = useUnreadCount();
  const campaignsQuery = useLiveCampaigns();
  const proposalsQuery = useMyProposals();

  const creator = profileQuery.data;
  const earnings = earningsQuery.data;
  const unreadCount = unreadQuery.data?.unread ?? 0;

  const proposalsList = proposalsQuery.data?.data || [];

  const proposalCounts = useMemo(() => {
    const tally = tallyProposalStatuses(proposalsList);
    return { ...tally, all: proposalsList };
  }, [proposalsList]);

  const urgentTasks = queueQuery.data?.urgentTasks || [];
  const upcomingTasks = queueQuery.data?.upcomingTasks || [];

  const waitingProposals = useMemo(() => {
    return proposalsList.filter((p) => {
      const s = (p.status || '').toLowerCase();
      return s === 'applied' || s === 'shortlisted';
    });
  }, [proposalsList]);

  const briefsForYou = useMemo(() => {
    // Briefs the creator already applied to or won are not recommendations
    // (UI audit creator-home/W1).
    const appliedTo = new Set(proposalsList.map((p) => p.campaignId));
    const list = (campaignsQuery.data?.data || []).filter((c) => !appliedTo.has(c.id));
    const creatorNiches = new Set(creator?.niches || []);
    const matching = list.filter((c) => creatorNiches.has(c.niche as any));
    const items = matching.length > 0 ? matching : list;
    return items.slice(0, 3);
  }, [campaignsQuery.data?.data, creator?.niches, proposalsList]);

  const isEmpty =
    urgentTasks.length === 0 && upcomingTasks.length === 0 && waitingProposals.length === 0;

  const combinedState = combineQueries(
    profileQuery,
    earningsQuery,
    queueQuery,
    campaignsQuery,
    proposalsQuery,
  );

  const isInitialLoading =
    Boolean(profileQuery.isLoading) ||
    Boolean(earningsQuery.isLoading) ||
    Boolean(queueQuery.isLoading);
  const hasInitialError =
    Boolean(profileQuery.isError) || Boolean(earningsQuery.isError) || Boolean(queueQuery.isError);

  return {
    creator,
    earnings,
    unreadCount,
    urgentTasks,
    upcomingTasks,
    waitingProposals,
    proposalCounts,
    briefsForYou,
    isEmpty,
    combinedState,
    isInitialLoading,
    hasInitialError,
  };
}
