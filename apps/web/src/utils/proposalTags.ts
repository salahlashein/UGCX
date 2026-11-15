import { toCents } from './money';

export interface ProposalLike {
  id: string;
  price?: string | number;
  creatorPrice?: string | number;
  deliveryDays?: number;
  status?: string;
  creatorStats?: { jobsDone?: number; approvalRate?: number } | null;
  [key: string]: any;
}

export interface ProposalTagResult {
  isLowestPrice: boolean;
  isFastestDelivery: boolean;
  isTopApproval: boolean;
}

/**
 * Compares proposals and identifies which open proposals have the lowest price
 * and/or fastest delivery time. Declined proposals never receive tags.
 */
export function compareTags(proposals: ProposalLike[]): Record<string, ProposalTagResult> {
  const result: Record<string, ProposalTagResult> = {};

  for (const p of proposals) {
    result[p.id] = {
      isLowestPrice: false,
      isFastestDelivery: false,
      isTopApproval: false,
    };
  }

  const openProposals = proposals.filter((p) => (p.status || '').toLowerCase() !== 'declined');

  if (openProposals.length === 0) {
    return result;
  }

  // Find minimum price
  let minPriceCents = Infinity;
  for (const p of openProposals) {
    const priceCents = toCents(p.price ?? p.creatorPrice);
    if (priceCents < minPriceCents) {
      minPriceCents = priceCents;
    }
  }

  // Find fastest delivery days
  let minDays = Infinity;
  for (const p of openProposals) {
    const days = p.deliveryDays ?? Infinity;
    if (days < minDays) {
      minDays = days;
    }
  }

  // Top approval is a comparison, not a threshold. It counts only creators
  // with a real job history, and never when every open proposal would win it.
  const rated = openProposals.filter(
    (p) => (p.creatorStats?.jobsDone ?? 0) > 0 && typeof p.creatorStats?.approvalRate === 'number',
  );
  let maxApproval = -1;
  for (const p of rated) {
    const rate = p.creatorStats?.approvalRate ?? -1;
    if (rate > maxApproval) maxApproval = rate;
  }
  const topApprovalIds =
    rated.length > 1 && maxApproval >= 0
      ? rated.filter((p) => (p.creatorStats?.approvalRate ?? -1) === maxApproval).map((p) => p.id)
      : [];
  const everyRatedWins = topApprovalIds.length === rated.length;

  for (const p of openProposals) {
    const priceCents = toCents(p.price ?? p.creatorPrice);
    const days = p.deliveryDays ?? Infinity;

    if (minPriceCents !== Infinity && priceCents === minPriceCents) {
      result[p.id].isLowestPrice = true;
    }

    if (minDays !== Infinity && days === minDays) {
      result[p.id].isFastestDelivery = true;
    }

    if (!everyRatedWins && topApprovalIds.includes(p.id)) {
      result[p.id].isTopApproval = true;
    }
  }

  // A tag that every open proposal carries says nothing. Drop it.
  if (openProposals.length > 1) {
    const allLowest = openProposals.every((p) => result[p.id].isLowestPrice);
    const allFastest = openProposals.every((p) => result[p.id].isFastestDelivery);
    for (const p of openProposals) {
      if (allLowest) result[p.id].isLowestPrice = false;
      if (allFastest) result[p.id].isFastestDelivery = false;
    }
  }

  return result;
}
