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
export function groupBriefsByPipelineStage(
  briefs: PipelineBriefItem[] = [],
  locale: Locale = 'en',
): PipelineStage[] {
  const groups: Record<BriefStage, string[]> = {
    draft: [],
    live: [],
    in_production: [],
    in_review: [],
    completed: [],
  };

  for (const b of briefs) {
    const stage = deriveStage(b);
    if (groups[stage]) {
      groups[stage].push(b.title || '');
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
