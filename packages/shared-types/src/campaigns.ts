import type { Language, Niche } from './common';

export type CampaignStatus = 'draft' | 'live';
export type VideoType = 'unboxing' | 'testimonial' | 'demo' | 'tutorial' | 'other';
// 'ai' is reserved for Phase 3; not a valid value yet (TASK-P1-007).
export type ScriptMode = 'brand' | 'creator';

export interface Campaign {
  id: string;
  brandId: string;
  productId: string;
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
  createdAt: string;
  updatedAt: string;
}

/** POST /api/v1/campaigns */
export interface CreateCampaignRequest {
  productId: string;
}

export interface UpdateCampaignRequest {
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
}

/** GET /api/v1/campaigns (creator browse, REQ-007) */
export interface QueryCampaignsRequest {
  page?: number;
  perPage?: number;
  niche?: Niche;
  language?: Language;
  country?: string;
}
