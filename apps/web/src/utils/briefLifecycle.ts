import { toCents } from './money';

export interface CampaignLike {
  id?: string;
  status?: string;
  createdAt?: string;
  fundedAt?: string | null;
  publishedAt?: string | null;
  slots?: number;
  escrowFundedAmount?: string | number | null;
  [key: string]: any;
}

export interface CollabLike {
  id?: string;
  status?: string;
  [key: string]: any;
}

export type LifecycleStepKey = 'created' | 'funded' | 'live' | 'hired' | 'delivered' | 'closed';

export interface LifecycleStep {
  key: LifecycleStepKey;
  label: string;
  state: 'done' | 'current' | 'todo';
  detail?: string;
  date?: string;
}

/**
 * Returns the six operational lifecycle steps for a campaign:
 * 1. Created
 * 2. Funded
 * 3. Live
 * 4. Creators hired
 * 5. Delivered
 * 6. Closed
 */
export function lifecycleSteps(
  campaign: CampaignLike,
  collaborations: CollabLike[] = [],
): LifecycleStep[] {
  const status = (campaign?.status || 'draft').toLowerCase();
  const slots = Math.max(1, campaign?.slots || 1);
  const fundedCents = toCents(campaign?.escrowFundedAmount);
  const isFunded = fundedCents > 0 || status === 'live' || status === 'completed';

  const hiredCollabs = collaborations.filter((c) => {
    const s = (c?.status || '').toLowerCase();
    return s !== 'cancelled' && s !== 'pending_payment';
  });
  const hiredCount = hiredCollabs.length;

  const deliveredCollabs = hiredCollabs.filter((c) => {
    const s = (c?.status || '').toLowerCase();
    return s === 'delivered' || s === 'approved' || s === 'paid';
  });
  const allDelivered = hiredCount > 0 && deliveredCollabs.length >= hiredCount;

  // Case 1: Draft
  if (status === 'draft') {
    return [
      { key: 'created', label: 'Created', state: 'done', date: campaign.createdAt },
      { key: 'funded', label: 'Funded', state: 'todo' },
      { key: 'live', label: 'Live', state: 'todo' },
      { key: 'hired', label: 'Creators hired', state: 'todo', detail: `0 / ${slots}` },
      { key: 'delivered', label: 'Delivered', state: 'todo' },
      { key: 'closed', label: 'Closed', state: 'todo' },
    ];
  }

  // Case 2: Completed
  if (status === 'completed') {
    return [
      { key: 'created', label: 'Created', state: 'done', date: campaign.createdAt },
      { key: 'funded', label: 'Funded', state: 'done', date: campaign.fundedAt || undefined },
      { key: 'live', label: 'Live', state: 'done', date: campaign.publishedAt || undefined },
      { key: 'hired', label: 'Creators hired', state: 'done', detail: `${slots} / ${slots}` },
      { key: 'delivered', label: 'Delivered', state: 'done' },
      { key: 'closed', label: 'Closed', state: 'done' },
    ];
  }

  // Case 3: Cancelled
  if (status === 'cancelled') {
    return [
      { key: 'created', label: 'Created', state: 'done', date: campaign.createdAt },
      {
        key: 'funded',
        label: 'Funded',
        state: isFunded ? 'done' : 'todo',
        date: campaign.fundedAt || undefined,
      },
      {
        key: 'live',
        label: 'Live',
        state: campaign.publishedAt ? 'done' : 'todo',
        date: campaign.publishedAt || undefined,
      },
      {
        key: 'hired',
        label: 'Creators hired',
        state: hiredCount > 0 ? 'done' : 'todo',
        detail: `${hiredCount} / ${slots}`,
      },
      { key: 'delivered', label: 'Delivered', state: 'todo' },
      { key: 'closed', label: 'Closed', state: 'done' },
    ];
  }

  // Case 4: Live / Active
  const hiredDone = hiredCount >= slots;
  const hiredState = hiredDone ? 'done' : 'current';

  let deliveredState: 'done' | 'current' | 'todo' = 'todo';
  if (allDelivered && hiredDone) {
    deliveredState = 'done';
  } else if (deliveredCollabs.length > 0 || (hiredDone && !allDelivered)) {
    deliveredState = 'current';
  }

  return [
    { key: 'created', label: 'Created', state: 'done', date: campaign.createdAt },
    { key: 'funded', label: 'Funded', state: 'done', date: campaign.fundedAt || undefined },
    { key: 'live', label: 'Live', state: 'done', date: campaign.publishedAt || undefined },
    {
      key: 'hired',
      label: 'Creators hired',
      state: hiredState,
      detail: `${hiredCount} / ${slots}`,
    },
    { key: 'delivered', label: 'Delivered', state: deliveredState },
    { key: 'closed', label: 'Closed', state: 'todo' },
  ];
}
