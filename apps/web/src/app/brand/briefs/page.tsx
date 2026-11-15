'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { QueryStateView } from '../../../components/ui';
import { spacing } from '../../../theme/tokens';
import { useMyBriefs, type BriefStatusFilter } from '../../../hooks/api/useCampaigns';
import { useBrandRole } from '../../../hooks/useBrandRole';
import { useTranslation } from '../../../i18n';
import { combineQueries } from '../../../utils/queryAggregator';
import {
  BriefsHeader,
  BriefsFilterBar,
  BriefsDataTable,
} from '../../../features/brand/briefs/components';

export default function BrandBriefsPage() {
  const router = useRouter();
  const { locale } = useTranslation();
  const { can, role } = useBrandRole();
  const [filter, setFilter] = useState<BriefStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const briefsQuery = useMyBriefs({ status: filter, perPage: 100, q: searchQuery.trim() || undefined });
  const queryState = combineQueries(briefsQuery);
  const isViewer = role === 'viewer';
  const counts = briefsQuery.data?.counts ?? { all: 0, draft: 0, open: 0, completed: 0 };
  const allBriefs = briefsQuery.data?.data ?? [];

  const filteredBriefs = useMemo(() => {
    if (!searchQuery.trim()) return allBriefs;
    const q = searchQuery.toLowerCase().trim();
    return allBriefs.filter((b) => b.title.toLowerCase().includes(q));
  }, [allBriefs, searchQuery]);

  const canCreate = !isViewer && can('createBrief');

  return (
    <AppShell requiredRole="brand">
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
        <BriefsHeader canCreate={canCreate} locale={locale} />
        <BriefsFilterBar
          filter={filter}
          counts={counts}
          searchQuery={searchQuery}
          onFilterChange={setFilter}
          onSearchChange={setSearchQuery}
          locale={locale}
        />
        <QueryStateView
          isLoading={queryState.isLoading}
          isError={queryState.isError}
          data={filteredBriefs}
          isEmpty={(items) => items.length === 0}
          onRetry={queryState.refetch}
          emptyTitle={locale === 'ar' ? 'لا توجد بريفات' : 'No briefs yet'}
          emptyMessage={
            locale === 'ar'
              ? 'أنشئ بريفك الأول للبدء في استقبال عروض المبدعين وصناع المحتوى.'
              : 'Post your first brief to start receiving creator proposals.'
          }
          emptyActionTitle={canCreate ? (locale === 'ar' ? 'إنشاء بريف جديد' : 'New brief') : undefined}
          onEmptyAction={canCreate ? () => router.push('/brand/briefs/new') : undefined}
        >
          {(items) => (
            <BriefsDataTable
              briefs={items}
              locale={locale}
              onRowClick={(b) => router.push(`/brand/briefs/${b.id}`)}
            />
          )}
        </QueryStateView>
      </div>
    </AppShell>
  );
}
