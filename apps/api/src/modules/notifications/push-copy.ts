import type { NotificationEvent } from '@ugcx/shared-types';

export const PUSH_COPY: Record<
  NotificationEvent,
  { title: string; body: string }
> = {
  brief_published: {
    title: 'Brief live',
    body: 'Your brief is now live and accepting proposals.',
  },
  proposal_received: {
    title: 'New proposal',
    body: 'You received a new proposal on your brief.',
  },
  proposal_shortlisted: {
    title: 'Proposal shortlisted',
    body: 'A brand shortlisted your proposal.',
  },
  proposal_declined: {
    title: 'Proposal update',
    body: 'A brand declined your proposal.',
  },
  escrow_funded: {
    title: 'Escrow funded',
    body: 'Escrow has been funded for your collaboration.',
  },
  shipment_confirmed: {
    title: 'Product shipped',
    body: 'The brand shipped the product for your collaboration.',
  },
  shipment_received: {
    title: 'Product received',
    body: 'The creator confirmed product receipt.',
  },
  deliverable_submitted: {
    title: 'Deliverable submitted',
    body: 'A creator submitted a deliverable for review.',
  },
  revision_requested: {
    title: 'Revision requested',
    body: 'The brand requested a revision on your deliverable.',
  },
  escrow_released: {
    title: 'Escrow released',
    body: 'Escrow payment has been released.',
  },
  message_received: {
    title: 'New message',
    body: 'You received a new chat message.',
  },
  payout_sent: {
    title: 'Payout sent',
    body: 'Your payout has been processed.',
  },
};
