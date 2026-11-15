export type BillingEntryType = 'charge' | 'refund' | 'hold' | 'release';

export interface BrandMoneyTotals {
  funded: string;      // sum of completed charge rows
  refunded: string;    // sum of completed refund rows
  released: string;    // sum of completed release rows (includes platform fee)
  allocated: string;   // sum of completed hold rows minus released
  available: string;   // funded - refunded - (all holds)
  currency: string;
}

export interface BillingEntry {
  id: string;
  type: BillingEntryType;
  label: string;
  campaignId: string | null;
  campaignTitle: string | null;
  method: string;
  amount: string;
  currency: string;
  createdAt: string;
  direction?: 'in' | 'out' | 'hold';
  escrowAmount?: string;
  counterpartName?: string | null;
  reference?: string;
}

export interface BillingSummary extends BrandMoneyTotals {
  lifetimeSpend: string;
}
