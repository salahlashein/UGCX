/**
 * Centralized hierarchical Query Key Factory for TanStack Query.
 * Eliminates ad-hoc string arrays and guarantees type-safe cache queries and invalidations.
 */
export const queryKeys = {
  campaigns: {
    all: ['campaigns'] as const,
    mine: (params?: unknown) =>
      params !== undefined
        ? (['campaigns', 'mine', params] as const)
        : (['campaigns', 'mine'] as const),
    live: (query?: unknown) =>
      query !== undefined
        ? (['campaigns', 'live', query] as const)
        : (['campaigns', 'live'] as const),
    detail: (id: string | undefined) => ['campaigns', id] as const,
  },

  collaborations: {
    all: ['collaborations'] as const,
    mine: () => ['collaborations', 'mine'] as const,
    detail: (id: string | undefined) => ['collaborations', id] as const,
    deliverables: (collaborationId: string | undefined) =>
      ['collaborations', collaborationId, 'deliverables'] as const,
  },

  proposals: {
    all: ['proposals'] as const,
    mine: () => ['proposals', 'mine'] as const,
    byCampaign: (campaignId: string | undefined, params?: unknown) =>
      params !== undefined
        ? (['proposals', 'campaign', campaignId, params] as const)
        : (['proposals', 'campaign', campaignId] as const),
    creatorProfile: (proposalId: string | undefined) =>
      ['proposals', proposalId, 'creator-profile'] as const,
    quote: (proposalId: string | undefined) => ['proposals', proposalId, 'quote'] as const,
  },

  deliverables: {
    all: ['deliverables'] as const,
    detail: (id: string | undefined) => ['deliverables', id] as const,
    playUrl: (id: string | undefined) => ['deliverables', id, 'play-url'] as const,
    byCollaboration: (collaborationId: string | undefined) =>
      ['collaborations', collaborationId, 'deliverables'] as const,
  },

  creator: {
    all: ['creator'] as const,
    me: () => ['creator', 'me'] as const,
    earnings: () => ['creator', 'me', 'earnings'] as const,
    portfolio: () => ['creator', 'me', 'portfolio-items'] as const,
    payoutDetails: (creatorId?: string) => ['creator', creatorId, 'payout-details'] as const,
    ledger: () => ['creator', 'me', 'ledger'] as const,
    payoutRequests: () => ['creator', 'me', 'payout-requests'] as const,
    stats: () => ['creator', 'stats'] as const,
    homeQueue: () => ['creator', 'homeQueue'] as const,
  },

  brand: {
    all: ['brand'] as const,
    me: () => ['brand', 'me'] as const,
    members: () => ['brand', 'members'] as const,
    stats: () => ['brand', 'stats'] as const,
    dashboard: () => ['brand', 'dashboard'] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    list: (params?: unknown) =>
      params !== undefined ? (['notifications', params] as const) : (['notifications'] as const),
    unreadCount: () => ['notifications', 'unread-count'] as const,
  },

  chats: {
    all: ['chats'] as const,
    messages: (collaborationId: string | undefined) => ['messages', collaborationId] as const,
  },

  billing: {
    all: ['billing'] as const,
    me: (params?: unknown) =>
      params !== undefined ? (['billing', 'me', params] as const) : (['billing', 'me'] as const),
  },

  escrow: {
    all: ['escrow'] as const,
    byCampaign: (campaignId: string | undefined) => ['escrow', campaignId] as const,
  },

  user: {
    all: ['users'] as const,
    me: () => ['users', 'me'] as const,
  },

  onboarding: {
    status: (userId: string | undefined) => ['onboarding', 'status', userId ?? ''] as const,
    insights: (city?: string) => ['onboarding', 'insights', city ?? ''] as const,
  },
} as const;
