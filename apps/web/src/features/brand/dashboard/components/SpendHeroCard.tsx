'use client';

import React from 'react';
import type { BrandDashboard } from '@ugcx/shared-types';
import { AppText, Button, Icon, SignatureCard } from '../../../../components/ui';
import { colors, spacing } from '../../../../theme/tokens';
import { formatMoney } from '../../../../utils/format';
import { centsToAmount } from '../../../../utils/money';
import type { Locale } from '../../../../i18n';

interface SpendHeroCardProps {
  dashboard: BrandDashboard;
  monthSpend: string;
  monthDeliverables: number;
  stillInEscrowCents: number;
  isViewer: boolean;
  canCreateBrief: boolean;
  canFundEscrow: boolean;
  locale: Locale;
  onNewBrief: () => void;
  onFundBrief: () => void;
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  } as const,
  badge: {
    fontSize: 12,
    color: '#bbf7d0',
    fontFamily: 'var(--font-mono, monospace)',
    padding: '2px 8px',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  } as const,
  // Scales down on phones so the figure is never cut (UI audit brand-dashboard/C3).
  amount: {
    fontSize: 'clamp(28px, 8.5vw, 42px)',
    fontWeight: 500,
    overflowWrap: 'anywhere',
    fontFamily: 'var(--font-mono, monospace)',
    color: colors.surface,
    letterSpacing: -0.5,
    direction: 'ltr',
    textAlign: 'start',
  } as const,
  actions: { display: 'flex', gap: spacing.md, marginTop: spacing.md } as const,
};

export function SpendHeroCard({
  dashboard,
  monthSpend,
  monthDeliverables,
  stillInEscrowCents,
  isViewer,
  canCreateBrief,
  canFundEscrow,
  locale,
  onNewBrief,
  onFundBrief,
}: SpendHeroCardProps) {
  const isAr = locale === 'ar';
  const availableEscrow = dashboard.totals?.available ?? centsToAmount(stillInEscrowCents);
  // Same terms as Billing: "unallocated" is free to hire with; "held" is
  // reserved for hired creators (UI audit brand-dashboard/C2).
  const heldEscrow = dashboard.totals?.allocated ?? null;

  return (
    <SignatureCard variant="hero" elevation="card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        <div style={styles.header}>
          <AppText variant="dataMonoCaps" color="rgba(255,255,255,0.7)">
            {isAr ? 'تمويل هذا الشهر' : 'Funded this month'}
          </AppText>
          {dashboard.month?.released && (
            <span style={styles.badge}>
              {isAr ? 'مصروف هذا الشهر: ' : 'Released this month: '}
              <span style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                {formatMoney(dashboard.month.released)}
              </span>
            </span>
          )}
        </div>

        <div style={styles.amount}>{formatMoney(monthSpend)}</div>

        <AppText variant="bodySmall" color="rgba(255,255,255,0.85)">
          {monthDeliverables}{' '}
          {isAr ? 'فيديو معتمد' : monthDeliverables === 1 ? 'approved video' : 'approved videos'} ·{' '}
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              direction: 'ltr',
              display: 'inline-block',
            }}
          >
            {formatMoney(availableEscrow)}
          </span>{' '}
          {isAr ? 'متاح للتعيين' : 'unallocated'}
          {heldEscrow && Number(heldEscrow) > 0 ? (
            <>
              {' '}
              ·{' '}
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  direction: 'ltr',
                  display: 'inline-block',
                }}
              >
                {formatMoney(heldEscrow)}
              </span>{' '}
              {isAr ? 'محجوز لكريتورز' : 'held for hired creators'}
            </>
          ) : null}
        </AppText>

        {!isViewer && (
          <div style={styles.actions}>
            {canCreateBrief && (
              <Button variant="mint" size="sm" onClick={onNewBrief}>
                <Icon name="plus" size={14} />
                <span>{isAr ? 'بريف جديد' : 'New brief'}</span>
              </Button>
            )}
            {canFundEscrow && (
              <Button variant="secondary" size="sm" onClick={onFundBrief}>
                <span>{isAr ? 'تمويل بريف' : 'Fund a brief'}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </SignatureCard>
  );
}
