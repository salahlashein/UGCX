import { toCents } from './money';
import { deriveStage, type BriefStage, type BriefForStage } from './briefStage';
import type { Locale } from '../i18n';
import type { PipelineStage } from '../components/ui';

export interface EscrowBriefItem {
  escrowFundedAmount?: string | number | null;
  escrowAllocatedAmount?: string | number | null;
  escrowRefundedAmount?: string | number | null;
}

export interface PipelineBriefItem extends BriefForStage {
  title?: string;
}

/**
 * Computes remaining escrow balance in integer cents across an array of briefs.
 */
export function calculateStillInEscrowCents(briefs: EscrowBriefItem[] = []): number {
  let totalCents = 0;
  for (const b of briefs) {
    const funded = toCents(b.escrowFundedAmount);
    const allocated = toCents(b.escrowAllocatedAmount);
    const refunded = toCents(b.escrowRefundedAmount);
    const left = funded - allocated - refunded;
    if (left > 0) {
      totalCents += left;
    }
  }
  return totalCents;
}

/**
 * Groups briefs into the 5 standard pipeline stages with localized stage names.
 */
export interface PipelineCollaborationItem {
  campaignId: string;
  status: string;
  creatorName?: string | null;
}

const COLLAB_STAGE: Record<string, BriefStage> = {
  pending_payment: 'in_production',
  funded: 'in_production',
  shipped: 'in_production',
  received: 'in_production',
  revision_requested: 'in_production',
  delivered: 'in_review',
  approved: 'completed',
  paid: 'completed',
};

/**
 * Pipeline stages. Draft and Live count briefs; production, review and
 * completed count collaborations when they are given, so a brief with two
 * hired creators shows both (one in review, one paid) instead of only its
 * latest collaboration (UI audit brand-dashboard/C1).
 */
export function groupBriefsByPipelineStage(
  briefs: PipelineBriefItem[] = [],
  locale: Locale = 'en',
  collaborations?: PipelineCollaborationItem[],
): PipelineStage[] {
  const groups: Record<BriefStage, string[]> = {
    draft: [],
    live: [],
    in_production: [],
    in_review: [],
    completed: [],
  };

  if (collaborations) {
    const titles = new Map<string, string>();
    for (const b of briefs as Array<PipelineBriefItem & { id?: string }>) {
      if (b.id) titles.set(b.id, b.title || '');
      const status = (b as { status?: string }).status;
      if (status === 'draft') groups.draft.push(b.title || '');
      else if (status === 'live' || status === 'paused') groups.live.push(b.title || '');
    }
    for (const c of collaborations) {
      const stage = COLLAB_STAGE[c.status];
      if (!stage) continue;
      const title = titles.get(c.campaignId) || '';
      groups[stage].push(c.creatorName ? `${title} · ${c.creatorName}` : title);
    }
  } else {
    for (const b of briefs) {
      const stage = deriveStage(b);
      if (groups[stage]) {
        groups[stage].push(b.title || '');
      }
    }
  }

  const isAr = locale === 'ar';

  return [
    {
      id: 'draft',
      name: isAr ? 'مسودة' : 'Draft',
      count: groups.draft.length,
      items: groups.draft,
    },
    {
      id: 'live',
      name: isAr ? 'نشط' : 'Live',
      count: groups.live.length,
      items: groups.live,
      isHot: groups.live.length > 0,
    },
    {
      id: 'in_production',
      name: isAr ? 'قيد التنفيذ' : 'In production',
      count: groups.in_production.length,
      items: groups.in_production,
    },
    {
      id: 'in_review',
      name: isAr ? 'قيد المراجعة' : 'In review',
      count: groups.in_review.length,
      items: groups.in_review,
      isHot: groups.in_review.length > 0,
    },
    {
      id: 'completed',
      name: isAr ? 'مكتمل' : 'Completed',
      count: groups.completed.length,
      items: groups.completed,
    },
  ];
}
