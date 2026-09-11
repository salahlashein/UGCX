// Mirrors apps/api/src/modules/deliverables (feature_backend_escrow_payments).

export type DeliverableType = 'ready_ad' | 'raw' | 'broll' | 'hook' | 'photo' | 'voiceover';

export type DeliverableStatus = 'submitted' | 'approved' | 'revision_requested' | 'declined';

export interface Deliverable {
  id: string;
  collaborationId: string;
  type: DeliverableType;
  fileUrl: string;
  durationSeconds: number | null;
  status: DeliverableStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverableFeedback {
  id: string;
  deliverableId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
}

/** POST /api/v1/collaborations/{id}/deliverables/upload-url */
export interface RequestUploadUrlRequest {
  contentType: string;
}

export interface RequestUploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

/** POST /api/v1/collaborations/{id}/deliverables */
export interface RegisterDeliverableRequest {
  type: DeliverableType;
  fileUrl: string;
  durationSeconds?: number;
}

/** POST /api/v1/deliverables/{id}/review */
export type ReviewDeliverableAction = 'approve' | 'request_revision' | 'decline';

export interface ReviewDeliverableRequest {
  action: ReviewDeliverableAction;
  feedback?: string;
}

export interface ReviewDeliverableResponse {
  id: string;
  status: DeliverableStatus;
  collaborationStatus: string;
}

// feature_mobile_app_phase1 addendum: GET /api/v1/collaborations/{id}/deliverables
// was not exposed by the escrow/payments plan's controller, but
// TASK-P1-008's review actions have no other way to discover a
// deliverable's id. Returns Deliverable[] for either participant.
