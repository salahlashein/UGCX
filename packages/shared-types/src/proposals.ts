import type { Niche } from './common';

// REQ-002 (feature_backend_escrow_payments): 'accepted' is set by
// CollaborationsService when a Paymob webhook funds the collaboration
// created from this proposal, never directly by a brand.
export type ProposalStatus = 'applied' | 'shortlisted' | 'declined' | 'accepted';

export interface Proposal {
  id: string;
  campaignId: string;
  creatorId: string;
  price: string;
  currency: string;
  deliveryDays: number;
  pitch: string;
  status: ProposalStatus;
  declineReason: string | null;
  createdAt: string;
  updatedAt: string;
  /** Brand list view only: who applied. */
  creator?: { id: string; displayName: string | null; city: string | null };
  creatorStats?: {
    jobsDone: number;
    approvalRate: number;
    averageRevisions: number;
  };
  portfolioCount?: number;
  /** Creator list view only: which brief, brand and product. */
  campaign?: {
    id: string;
    title: string;
    closesAt?: string | null;
    budgetMin?: string | number | null;
    budgetMax?: string | number | null;
    status?: string | null;
    brand?: { id: string; companyName: string | null; logoUrl: string | null } | null;
    product?: { id: string; name: string } | null;
  };
}

/** POST /api/v1/campaigns/{id}/proposals */
export interface CreateProposalRequest {
  price: number;
  deliveryDays: number;
  pitch: string;
}

/** PATCH /api/v1/proposals/{id}/status */
export interface UpdateProposalStatusRequest {
  status: Extract<ProposalStatus, 'shortlisted' | 'declined'>;
}

/** GET /api/v1/proposals/{id}/creator-profile */
export interface CreatorProfilePreview {
  creatorId: string;
  displayName: string | null;
  city: string | null;
  niches: Niche[];
  approvalRate: number;
  averageRevisions: number;
  jobsDone: number;
  portfolio: { id: string; mediaUrl: string; mediaType: string; thumbnailUrl?: string }[];
  portfolioCount?: number;
  proposal: {
    id: string;
    price: string;
    currency: string;
    deliveryDays: number;
    pitch: string | null;
  };
}

export interface ProposalQuote {
  proposalId: string;
  creatorPrice: string;
  platformFee: string;
  totalAmount: string;       // price + fee, what the hold takes
  available: string;         // campaign available escrow now
  availableAfter: string;    // available - totalAmount, can be negative
  sufficient: boolean;
  shortfall: string;         // '0.00' when sufficient
  currency: string;
}
