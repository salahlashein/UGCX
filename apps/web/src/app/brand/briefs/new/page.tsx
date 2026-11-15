'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../../components/layout/AppShell';
import { AppText, Button } from '../../../../components/ui';
import { colors, spacing } from '../../../../theme/tokens';
import { BriefForm } from '../../../../components/brand/BriefForm';
import { useTranslation } from '../../../../i18n';

export default function NewBriefPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();

  return (
    <AppShell requiredRole="brand">
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <Button variant="secondary" size="sm" onClick={() => router.push('/brand/briefs')}>
            {locale === 'ar' ? '→ البريفات' : '← Briefs'}
          </Button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <AppText variant="h2" style={{ fontWeight: 500 }}>
              {locale === 'ar' ? 'إنشاء بريف جديد' : 'Create new brief'}
            </AppText>
            <AppText variant="caption" color={colors.muted}>
              {locale === 'ar'
                ? 'حدد تفاصيل المحتوى المطلوب والميزانية للبدء في استقبال عروض الصناع'
                : 'Define requirements and budget to receive proposals from creators.'}
            </AppText>
          </div>
        </div>

        <BriefForm />
      </div>
    </AppShell>
  );
}
