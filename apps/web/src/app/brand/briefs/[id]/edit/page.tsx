'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../../../components/layout/AppShell';
import { AppText, Button, QueryStateView } from '../../../../../components/ui';
import { colors, spacing } from '../../../../../theme/tokens';
import { BriefForm } from '../../../../../components/brand/BriefForm';
import { useCampaign } from '../../../../../hooks/api/useCampaigns';
import { useTranslation } from '../../../../../i18n';

export default function EditBriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t, locale } = useTranslation();

  const campaignQuery = useCampaign(id);

  return (
    <AppShell requiredRole="brand">
      <QueryStateView
        isLoading={campaignQuery.isLoading}
        isError={campaignQuery.isError}
        data={campaignQuery.data}
        onRetry={() => campaignQuery.refetch()}
      >
        {(campaign) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/brand/briefs/${id}`)}
              >
                {locale === 'ar' ? '→ البريف' : '← Brief'}
              </Button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <AppText variant="h2" style={{ fontWeight: 500 }}>
                  {locale === 'ar' ? 'تعديل البريف' : 'Edit brief'}
                </AppText>
                <AppText variant="caption" color={colors.muted}>
                  {campaign.title}
                </AppText>
              </div>
            </div>

            <BriefForm initialData={campaign} isEdit />
          </div>
        )}
      </QueryStateView>
    </AppShell>
  );
}
