'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppText, Button, Icon } from '../../../../components/ui';
import { colors, spacing } from '../../../../theme/tokens';
import type { Locale } from '../../../../i18n';

interface BriefsHeaderProps {
  canCreate: boolean;
  locale: Locale;
}

export function BriefsHeader({ canCreate, locale }: BriefsHeaderProps) {
  const router = useRouter();
  const isAr = locale === 'ar';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.md }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <AppText variant="caption" color={colors.textSecondary}>
          {isAr ? 'إدارة كافة البريفات والحملات' : 'Manage campaigns & briefs'}
        </AppText>
        <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
          {isAr ? 'البريفات' : 'My briefs'}
        </AppText>
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
