import type { Niche } from './common';

export type VettingStatus = 'pending' | 'approved' | 'rejected';
export type PortfolioMediaType = 'image' | 'video';
export type PayoutMethod = 'bank_transfer' | 'instapay' | 'mobile_wallet';

export interface Creator {
  id: string;
  userId: string;
  displayName: string | null;
  city: string | null;
  country: string;
  niches: Niche[];
  basePrice: string | null;
  vettingStatus: VettingStatus;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  verificationClipUrl: string | null;
  stats?: {
    collaborations: number;
    approved: number | 'N/A';
    revisionsAvg: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCreatorRequest {
  displayName?: string;
  city?: string;
  niches?: Niche[];
  basePrice?: number;
  verificationClipUrl?: string;
}

export interface CreatorPortfolioItem {
  id: string;
  creatorId: string;
  mediaUrl: string;
  mediaType: PortfolioMediaType;
  createdAt: string;
}

export interface CreatePortfolioItemRequest {
  mediaUrl: string;
  mediaType: PortfolioMediaType;
}

export interface CreatorPayoutDetail {
  id: string;
  creatorId: string;
  method: PayoutMethod;
  accountIdentifier: string;
  holderName: string;
  updatedAt: string;
}

export interface UpsertPayoutDetailsRequest {
  method: PayoutMethod;
  accountIdentifier: string;
  holderName: string;
}

/** POST /api/v1/admin/creators/{id}/vetting */
export interface VetCreatorRequest {
  status: Extract<VettingStatus, 'approved' | 'rejected'>;
  reason?: string;
}
