// Mirrors apps/api/src/modules/collaborations (feature_backend_escrow_payments).

export type CollaborationStatus =
  | 'pending_payment'
  | 'funded'
  | 'payment_failed'
  | 'shipped'
  | 'delivered'
  | 'revision_requested'
  | 'approved'
  | 'paid'
  | 'cancelled';

export interface Collaboration {
  id: string;
  campaignId: string;
  proposalId: string;
  brandId: string;
  creatorId: string;
  creatorPrice: string;
  platformFee: string;
  totalAmount: string;
  currency: string;
  status: CollaborationStatus;
  paymobOrderId: string | null;
  shipmentCarrier: string | null;
  shipmentTrackingNumber: string | null;
  shipmentConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** POST /api/v1/proposals/{id}/accept */
export interface AcceptProposalResponse {
  collaborationId: string;
  status: Extract<CollaborationStatus, 'pending_payment'>;
  checkoutUrl: string;
}

/** POST /api/v1/collaborations/{id}/confirm-shipment */
export interface ConfirmShipmentRequest {
  carrier: string;
  trackingNumber: string;
}

// feature_mobile_app_phase1 addendum: GET /api/v1/collaborations/{id} and
// GET /api/v1/collaborations/mine were not exposed by the escrow/payments
// plan's controller, but both are required for REQ-005's status poll and
// the brand/creator collaboration-detail and "My Collaborations" screens.
// They return the Collaboration shape above (single item / paginated list).
