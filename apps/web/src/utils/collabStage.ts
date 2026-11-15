import type { CollaborationStatus } from '@ugcx/shared-types';
import type { StatusTone } from './statusTone';

export interface CollabStageInfo {
  stage: string;
  tone: StatusTone;
  nextStep: string;
  isActionable: boolean;
  isCompleted: boolean;
}

export function getCollabStage(
  status: CollaborationStatus | string,
  options?: { isBrand?: boolean; needsShipping?: boolean },
): CollabStageInfo {
  const norm = (status || '').toLowerCase() as CollaborationStatus;
  const isBrand = options?.isBrand ?? false;
  const needsShipping = options?.needsShipping ?? false;

  switch (norm) {
    case 'pending_payment':
      return {
        stage: 'Pending payment',
        tone: 'pend',
        nextStep: isBrand ? 'Complete payment' : 'Waiting for brand payment',
        isActionable: isBrand,
        isCompleted: false,
      };

    case 'funded':
      if (needsShipping) {
        return {
          stage: 'Awaiting shipment',
          tone: 'pend',
          nextStep: isBrand ? 'Ship product' : 'Waiting for product shipment',
          isActionable: isBrand,
          isCompleted: false,
        };
      }
      return {
        stage: 'To shoot',
        tone: 'ok',
        nextStep: isBrand ? 'Creator is shooting' : 'Submit deliverable',
        isActionable: !isBrand,
        isCompleted: false,
      };

    case 'shipped':
      return {
        stage: 'Product shipped',
        tone: 'ok',
        nextStep: isBrand ? 'Creator is shooting' : 'Submit deliverable',
        isActionable: !isBrand,
        isCompleted: false,
      };

    case 'delivered':
      return {
        stage: 'In review',
        tone: 'pend',
        nextStep: isBrand ? 'Review deliverable' : 'Waiting for brand review',
        isActionable: isBrand,
        isCompleted: false,
      };

    case 'revision_requested':
      return {
        stage: 'Revision',
        tone: 'bad',
        nextStep: isBrand ? 'Creator is revising' : 'Submit revision',
        isActionable: !isBrand,
        isCompleted: false,
      };

    case 'approved':
      return {
        stage: 'Approved',
        tone: 'ok',
        nextStep: 'Escrow released',
        isActionable: false,
        isCompleted: true,
      };

    case 'paid':
      return {
        stage: 'Completed',
        tone: 'ok',
        nextStep: 'Paid to creator',
        isActionable: false,
        isCompleted: true,
      };

    case 'payment_failed':
      return {
        stage: 'Payment failed',
        tone: 'bad',
        nextStep: isBrand ? 'Retry payment' : 'Payment failed',
        isActionable: isBrand,
        isCompleted: false,
      };

    case 'cancelled':
      return {
        stage: 'Cancelled',
        tone: 'neu',
        nextStep: 'None',
        isActionable: false,
        isCompleted: true,
      };

    default:
      return {
        stage: status || 'Unknown',
        tone: 'neu',
        nextStep: 'None',
        isActionable: false,
        isCompleted: false,
      };
  }
}
