export type BriefStage = 'draft' | 'live' | 'in_production' | 'in_review' | 'completed';

export interface BriefForStage {
  status?: string;
  collaborationStatus?: string | null;
}

/**
 * Derives the operational stage of a campaign based on brief status and latest collaboration status.
 */
export function deriveStage(brief: BriefForStage): BriefStage {
  const status = (brief.status || '').toLowerCase();
  if (status === 'draft') return 'draft';
  if (status === 'completed' || status === 'cancelled') return 'completed';

  const collabStatus = (brief.collaborationStatus || '').toLowerCase();
  if (collabStatus === 'delivered') return 'in_review';
  if (
    collabStatus === 'funded' ||
    collabStatus === 'shipped' ||
    collabStatus === 'revision_requested'
  ) {
    return 'in_production';
  }

  return 'live';
}
