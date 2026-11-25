'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppText, Card, KpiCells } from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import type { Locale } from '../../../../i18n';

interface ProposalStatusPillsProps {
  proposalCounts: { applied: number; shortlisted: number; won: number };
  locale: Locale;
}

export function ProposalStatusPills({ proposalCounts, locale }: ProposalStatusPillsProps) {
  const router = useRouter();
  const isAr = locale === 'ar';

  return (
    <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        }}
      >
        <AppText variant="subtitle" style={{ fontWeight: 500, color: colors.textPrimary }}>
          {isAr ? 'عروضي المقدمة' : 'My proposals'}
        </AppText>
        <button
          type="button"
          onClick={() => router.push('/creator/proposals')}
          style={{
            background: 'none',
            border: 'none',
            color: colors.primary,
            fontSize: 13,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {isAr ? 'عرض الكل' : 'View all'} →
        </button>
      </div>

      <KpiCells
        cells={[
          { label: isAr ? 'مقدم' : 'Applied', value: String(proposalCounts.applied) },
          { label: isAr ? 'مؤهل' : 'Shortlist', value: String(proposalCounts.shortlisted) },
          { label: isAr ? 'فائز' : 'Won', value: String(proposalCounts.won) },
        ]}
      />
    </Card>
  );
}
