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

/** Senders pass these words when no name is saved. They are not real names. */
const PLACEHOLDER_NAMES = new Set(['brand', 'creator']);

function realName(value: string | number | undefined): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  if (!name || PLACEHOLDER_NAMES.has(name.toLowerCase())) return null;
  return name;
}

/**
 * Push title and body for one notification. When the params carry the real
 * brand or creator name, the body uses it. Otherwise it uses PUSH_COPY.
 */
export function pushCopyFor(
  event: NotificationEvent,
  params: Record<string, string | number> | null | undefined,
): { title: string; body: string } {
  const base = PUSH_COPY[event] ?? {
    title: 'Notification',
    body: 'You have a new update',
  };
  const brand = realName(params?.brandName);
  const creator = realName(params?.creatorName);

  switch (event) {
    case 'proposal_shortlisted':
      return brand
        ? { ...base, body: `${brand} shortlisted your proposal.` }
        : base;
    case 'proposal_declined':
      return brand
        ? { ...base, body: `${brand} declined your proposal.` }
        : base;
    case 'shipment_confirmed':
      return brand
        ? {
            ...base,
            body: `${brand} shipped the product for your collaboration.`,
          }
        : base;
    case 'revision_requested':
      return brand
        ? {
            ...base,
            body: `${brand} requested a revision on your deliverable.`,
          }
        : base;
    case 'shipment_received':
      return creator
        ? { ...base, body: `${creator} confirmed product receipt.` }
        : base;
    case 'deliverable_submitted':
      return creator
        ? { ...base, body: `${creator} submitted a deliverable for review.` }
        : base;
    default:
      return base;
  }
}
