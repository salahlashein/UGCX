'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Campaign } from '@ugcx/shared-types';
import { AppText, Button, Card, ListRow } from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import { formatMoney } from '../../../../utils/format';
import type { Locale } from '../../../../i18n';

interface RecommendedBriefsGridProps {
  briefsForYou: Campaign[];
  locale: Locale;
}

export function RecommendedBriefsGrid({ briefsForYou, locale }: RecommendedBriefsGridProps) {
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
          {isAr ? 'بريفات تناسبك' : 'Briefs for you'}
        </AppText>
        <button
          type="button"
          onClick={() => router.push('/creator/discover')}
          style={{
            background: 'none',
            border: 'none',
            color: colors.primary,
            fontSize: 13,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {isAr ? 'عرض الكل' : 'See all'} →
        </button>
      </div>

      {briefsForYou.length === 0 && (
        <AppText variant="bodySmall" color={colors.textSecondary}>
          {isAr
            ? 'قدّمت على كل البريفات المفتوحة. هنبلغك أول ما ينزل بريف جديد.'
            : "You've applied to every open brief. We'll tell you when a new one goes live."}
        </AppText>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {briefsForYou.map((brief) => {
          const brandName = (brief as any).brand?.companyName || (isAr ? 'علامة تجارية' : 'Brand');
          const duration = `${brief.durationSeconds}s`;
          const lang = (brief.language || 'AR').toUpperCase();

          return (
            <ListRow
              key={brief.id}
              title={brief.title}
              subtitle={`${brandName} · ${duration} · ${lang}`}
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 500,
                      fontSize: 13,
                      color: colors.textPrimary,
                      direction: 'ltr',
                    }}
                  >
                    {formatMoney(brief.budgetMin)} - {formatMoney(brief.budgetMax)}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/creator/discover/${brief.id}`)}
                  >
                    {isAr ? 'عرض' : 'View'}
                  </Button>
                </div>
              }
            />
          );
        })}
      </div>
    </Card>
  );
}
