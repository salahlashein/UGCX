import type { CampaignStatus } from './campaigns';
import type { CollaborationStatus } from './collaborations';
import type { BrandMoneyTotals } from './billing';

export interface DashboardBriefRow {
  id: string;
  title: string;
  meta: string;
  status: CampaignStatus;
  collaborationStatus: CollaborationStatus | null;
  proposalCount: number;
}

export interface DashboardSeriesPoint {
  month: string;      // 'YYYY-MM' in reporting time zone
  funded: string;     // sum of charge rows
  released: string;   // sum of release rows
}

export interface BrandDashboard {
  brandName: string | null;
  logoUrl: string | null;
  month: {
    spend: string;
    released?: string;
    deliverableCount: number;
    currency: string;
  };
  attention: {
    briefsNeedingProposalReview: number;
    deliverablesAwaitingReview: number;
  };
  activeBriefs: DashboardBriefRow[];
  activeBriefCount: number;
  series?: DashboardSeriesPoint[];
  totals?: BrandMoneyTotals;
}
