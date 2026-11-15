import type { NotificationEvent } from '@ugcx/shared-types';

export type Audience = 'brand_team' | 'brand_owner_approver' | 'creator';

export const EVENT_AUDIENCE: Record<NotificationEvent, Audience[]> = {
  brief_published: ['brand_team'],
  proposal_received: ['brand_owner_approver'],
  proposal_shortlisted: ['creator'],
  proposal_declined: ['creator'],
  escrow_funded: ['brand_owner_approver', 'creator'],
  shipment_confirmed: ['creator'],
  shipment_received: ['brand_owner_approver'],
  deliverable_submitted: ['brand_owner_approver'],
  revision_requested: ['creator'],
  escrow_released: ['brand_owner_approver', 'creator'],
  message_received: [], // resolved per message, the other participant only
  payout_sent: ['creator'],
};
