'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppText, Button, Icon } from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import type { Locale } from '../../../../i18n';
import { useMe } from '../../../../hooks/api/useMe';

interface DashboardHeaderProps {
  brandName: string;
  initials: string;
  canCreate: boolean;
  locale: Locale;
}

export function DashboardHeader({ brandName, initials, canCreate, locale }: DashboardHeaderProps) {
  const router = useRouter();
  const isAr = locale === 'ar';
  // Greet the person by first name. Without a saved name, keep the old label.
  const firstName = useMe().data?.displayName?.trim().split(/\s+/)[0] || null;
  const eyebrow = firstName
    ? isAr
      ? `أهلاً بعودتك يا ${firstName}`
      : `Welcome back, ${firstName}`
    : isAr
      ? 'لوحة تحكم العلامة التجارية'
      : 'Brand Workspace';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: spacing.md,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.card,
            backgroundColor: colors.accentSoft,
            color: colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 500,
            fontSize: 18,
          }}
        >
          {initials}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <AppText variant="caption" color={colors.textSecondary}>
            {eyebrow}
          </AppText>
          <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
            {brandName}
          </AppText>
        </div>
      </div>

      {canCreate && (
        <Button variant="primary" onClick={() => router.push('/brand/briefs/new')}>
          <Icon name="plus" size={16} />
          <span>{isAr ? 'إنشاء بريف جديد' : 'New brief'}</span>
        </Button>
      )}
    </div>
  );
}
