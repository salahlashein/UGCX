import type { Language, Niche } from './common';
import type { CollaborationStatus } from './collaborations';

export type CampaignStatus = 'draft' | 'live' | 'paused' | 'completed' | 'cancelled';

export type VideoType =
  'unboxing' | 'testimonial' | 'demo' | 'tutorial' | 'other' | 'talking_head' | 'try_on';

// 'ai' is reserved for Phase 3; not a valid value yet (TASK-P1-007).
export type ScriptMode = 'brand' | 'creator';

export interface Campaign {
  id: string;
  brandId: string;
  productId: string | null;
  title: string;
  brief: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  currency: string;
  publishedAt: string | null;
  closesAt: string | null;
  status: CampaignStatus;
  niche: Niche | null;
  language: Language | null;
  videoType: VideoType | null;
  durationSeconds: number | null;
  scriptMode: ScriptMode | null;
  script: string | null;
  talkingPoints: string[];
  doNotSay: string[];
  needsShipping: boolean;
  slots: number;
  revisionLimit: number;
  escrowFundedAmount: string;
  escrowAllocatedAmount: string;
  escrowRefundedAmount: string;
  fundingPaymobOrderId: string | null;
  fundingRequestedAmount: string | null;
  refundPending: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BriefListItem extends Campaign {
  proposalCount: number;
  acceptedCreatorName: string | null;
  collaborationStatus: CollaborationStatus | null;
  appliedCount: number;
  shortlistedCount: number;
  totalProposals: number;
  lowestPrice: string | null;
  hiredCount: number;
  hired: Array<{ creatorId: string; displayName: string | null; initials: string }>;
  fundedAt: string | null;
}

export interface BriefCounts {
  all: number;
  draft: number;
  open: number;
  completed: number;
}

export interface ListBriefsRequest {
  page?: number;
  perPage?: number;
  status?: 'all' | 'draft' | 'open' | 'completed';
  q?: string;
}

export interface UpdateCampaignRequest {
  title?: string;
  brief?: string;
  budgetMin?: number | string;
  budgetMax?: number | string;
  closesAt?: string;
  niche?: Niche;
  language?: Language;
  videoType?: VideoType;
  durationSeconds?: number;
  scriptMode?: ScriptMode;
  script?: string;
  talkingPoints?: string[];
  doNotSay?: string[];
  needsShipping?: boolean;
  slots?: number;
  revisionLimit?: number;
}

/** POST /api/v1/campaigns */
export interface CreateCampaignRequest extends UpdateCampaignRequest {
  productId?: string;
}

/** GET /api/v1/campaigns (creator browse, REQ-007) */
export interface QueryCampaignsRequest {
  page?: number;
  perPage?: number;
  q?: string;
  niche?: string;
  language?: Language;
  country?: string;
  minBudget?: number;
  maxBudget?: number;
  minDuration?: number;
  maxDuration?: number;
  needsShipping?: boolean;
  sort?: string;
}
