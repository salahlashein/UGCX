export interface ProposalStatusItem {
  status?: string | null;
}

export interface ProposalStatusTally {
  applied: number;
  shortlisted: number;
  won: number;
  waiting: number;
  declined: number;
  total: number;
  winRate: number;
}

/**
 * Deterministically computes proposal tallies and rates across lifecycle statuses.
 */
export function tallyProposalStatuses<T extends ProposalStatusItem>(
  proposals: T[] = [],
): ProposalStatusTally {
  let applied = 0;
  let shortlisted = 0;
  let won = 0;
  let declined = 0;

  for (const p of proposals) {
    const s = (p.status || '').toLowerCase();
    if (s === 'applied') applied += 1;
    else if (s === 'shortlisted') shortlisted += 1;
    else if (s === 'accepted') won += 1;
    else if (s === 'declined') declined += 1;
  }

  const waiting = applied + shortlisted;
  const total = proposals.length;
  const winRate = total > 0 ? Math.round((won / total) * 100) : 0;

  return {
    applied,
    shortlisted,
    won,
    waiting,
    declined,
    total,
    winRate,
  };
}
