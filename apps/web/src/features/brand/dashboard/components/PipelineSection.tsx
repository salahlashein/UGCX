'use client';

import React from 'react';
import { AppText, Card, Pipeline, type PipelineStage } from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import type { Locale } from '../../../../i18n';

interface PipelineSectionProps {
  stages: PipelineStage[];
  locale: Locale;
}

export function PipelineSection({ stages, locale }: PipelineSectionProps) {
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
          {isAr ? 'مسار البريفات' : 'Brief pipeline'}
        </AppText>
      </div>
      <Pipeline stages={stages} />
    </Card>
  );
}
