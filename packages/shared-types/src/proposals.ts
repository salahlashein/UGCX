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
