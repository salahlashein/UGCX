'use client';

import React from 'react';
import { AppText, BarChart, Card } from '../../../../components/ui';
import { colors, spacing } from '../../../../theme/tokens';
import { toCents } from '../../../../utils/money';
import { monthLabel } from '../../../../utils/labels';
import type { Locale } from '../../../../i18n';

interface FinancialActivityPoint {
  month: string;
  funded: string | number;
}

interface BriefsTableSectionProps {
  series?: FinancialActivityPoint[];
  locale: Locale;
}

export function BriefsTableSection({ series, locale }: BriefsTableSectionProps) {
  if (!series || series.length === 0) return null;

  const isAr = locale === 'ar';

  return (
    <Card variant="default" padding="lg">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
          flexWrap: 'wrap',
          gap: spacing.sm,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <AppText variant="h3" weight={500}>
            {isAr ? 'النشاط المالي لـ 6 أشهر' : '6-Month Financial Activity'}
          </AppText>
          <AppText variant="caption" tone="muted">
            {isAr ? 'مبالغ التمويل الشهري المودعة في الضمان' : 'Monthly escrow funded volumes'}
          </AppText>
        </div>
        <div style={{ display: 'flex', gap: spacing.md, fontSize: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: colors.primary }}>
            <span
              style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.primary }}
            />
            {isAr ? 'المودع' : 'Funded'}
          </span>
        </div>
      </div>
      <BarChart
        data={series.map((pt) => ({
          label: monthLabel(pt.month, locale),
          valueCents: toCents(pt.funded),
        }))}
        height={140}
      />
    </Card>
  );
}
