'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppText, Button, Card } from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import { formatMoney } from '../../../../utils/format';
import type { Locale } from '../../../../i18n';

interface EarningsHeroCardProps {
  earnings?: { pendingBalance?: string; escrowBalance?: string } | null;
  locale: Locale;
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  } as const,
  btn: {
    background: 'none',
    border: 'none',
    color: colors.primary,
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
  } as const,
  box: {
    padding: spacing.md,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.card,
    border: `1px solid ${colors.border}`,
  } as const,
  amount: {
    fontSize: 28,
    fontWeight: 500,
    fontFamily: 'var(--font-mono, monospace)',
    color: colors.primary,
    letterSpacing: -0.5,
    marginTop: spacing.xs,
    direction: 'ltr',
    textAlign: 'start',
  } as const,
  escrowRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${spacing.sm}px`,
  } as const,
  escrowVal: {
    fontFamily: 'var(--font-mono, monospace)',
    fontWeight: 500,
    fontSize: 15,
    direction: 'ltr',
    color: colors.textPrimary,
  } as const,
};

export function EarningsHeroCard({ earnings, locale }: EarningsHeroCardProps) {
  const router = useRouter();
  const isAr = locale === 'ar';

  return (
    <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
      <div style={styles.header}>
        <AppText variant="subtitle" style={{ fontWeight: 500, color: colors.textPrimary }}>
          {isAr ? 'الأرباح والرصيد' : 'Earnings'}
        </AppText>
        <button type="button" onClick={() => router.push('/creator/earnings')} style={styles.btn}>
          {isAr ? 'كشف الحساب' : 'Statement'} →
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <div style={styles.box}>
          <AppText variant="dataMonoCaps" color={colors.textSecondary}>
            {isAr ? 'الرصيد المتاح للسحب' : 'Available balance'}
          </AppText>
          <div style={styles.amount}>{formatMoney(earnings?.pendingBalance ?? '0.00')}</div>
        </div>

        <div style={styles.escrowRow}>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            {isAr ? 'قيد الضمان' : 'In escrow'}
          </AppText>
          <span style={styles.escrowVal}>{formatMoney(earnings?.escrowBalance ?? '0.00')}</span>
        </div>

        {/* Same rule as the earnings page: nothing to withdraw, no button (UI audit creator-home/W2). */}
        {Number(earnings?.pendingBalance ?? 0) > 0 ? (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => router.push('/creator/earnings')}
          >
            {isAr ? 'طلب سحب الرصيد' : 'Request payout'}
          </Button>
        ) : (
          <AppText variant="caption" color={colors.textSecondary}>
            {isAr
              ? 'هتقدر تسحب أول ما البراند يوافق على الفيديو.'
              : 'You can withdraw once a brand approves your video.'}
          </AppText>
        )}
      </div>
    </Card>
  );
}
