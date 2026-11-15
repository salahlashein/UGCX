'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Collaboration } from '@ugcx/shared-types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  DataTable,
  FilterChip,
  QueryStateView,
  StatusBadge,
  Tag,
  type DataTableColumn,
} from '../../../components/ui';
import { colors, radius, spacing } from '../../../theme/tokens';
import { useMyCollaborations } from '../../../hooks/api/useCollaborations';
import { useCreatorEarnings } from '../../../hooks/api/useCreator';
import { useTranslation } from '../../../i18n';
import { formatDateShort, formatDueDate, formatMoney } from '../../../utils/format';
import { getCollabStage } from '../../../utils/collabStage';

type WorkFilter = 'all' | 'active' | 'completed';

export default function CreatorWorkPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [filter, setFilter] = useState<WorkFilter>('active');

  const collaborationsQuery = useMyCollaborations();
  const earningsQuery = useCreatorEarnings();

  const allCollabs: Collaboration[] = Array.isArray(collaborationsQuery.data)
    ? (collaborationsQuery.data as any)
    : (collaborationsQuery.data as any)?.data || [];

  const escrowBalance = earningsQuery.data?.escrowBalance ?? '0.00';

  const activeCollabs = useMemo(() => {
    return allCollabs.filter((c) =>
      ['funded', 'shipped', 'delivered', 'revision_requested'].includes(c.status),
    );
  }, [allCollabs]);

  const completedCollabs = useMemo(() => {
    return allCollabs.filter((c) => ['approved', 'paid', 'cancelled'].includes(c.status));
  }, [allCollabs]);

  const filteredCollabs = useMemo(() => {
    if (filter === 'active') return activeCollabs;
    if (filter === 'completed') return completedCollabs;
    return allCollabs;
  }, [filter, activeCollabs, completedCollabs, allCollabs]);

  const columns: DataTableColumn<Collaboration>[] = [
    {
      key: 'job',
      header: locale === 'ar' ? 'العمل والبريف' : 'Job',
      render: (c) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 500, fontSize: 14, color: colors.textPrimary }}>
            {(c as any).campaign?.title || `Job #${c.id.slice(0, 8)}`}
          </span>
          <span style={{ fontSize: 12, color: colors.textSecondary }}>
            {(c as any).brand?.companyName || (locale === 'ar' ? 'العلامة التجارية' : 'Brand')}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: locale === 'ar' ? 'الحالة' : 'Status',
      render: (c) => {
        const info = getCollabStage(c.status);
        return <Tag tone={info.tone}>{info.stage}</Tag>;
      },
    },
    {
      key: 'due',
      header: locale === 'ar' ? 'الاستحقاق' : 'Due',
      render: (c) => {
        const dueAt = (c as any).dueAt;
        if (!dueAt) return <span style={{ color: colors.textTertiary, fontSize: 12 }}>-</span>;
        return <Tag tone="pend">{formatDueDate(dueAt, locale)}</Tag>;
      },
    },
    {
      key: 'revisions',
      header: locale === 'ar' ? 'التعديلات' : 'Revisions',
      align: 'end',
      render: (c) => {
        const used = (c as any).revisionsUsed ?? 0;
        const limit = (c as any).revisionLimit ?? 2;
        return (
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 13,
              color: colors.textPrimary,
            }}
          >
            {used} / {limit}
          </span>
        );
      },
    },
    {
      key: 'escrow',
      header: locale === 'ar' ? 'في الضمان' : 'In escrow',
      align: 'end',
      render: (c) => {
        const info = getCollabStage(c.status);
        if (info.isCompleted) return <span style={{ color: colors.textTertiary }}>-</span>;
        return (
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 500,
              fontSize: 13,
              color: colors.primary,
              direction: 'ltr',
              display: 'inline-block',
            }}
          >
            {formatMoney(c.creatorPrice)}
          </span>
        );
      },
    },
    {
      key: 'next',
      header: locale === 'ar' ? 'الخطوة التالية' : 'Next step',
      align: 'end',
      render: (c) => {
        const info = getCollabStage(c.status);
        if (info.isActionable) {
          return (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push(`/creator/work/${c.id}`)}
            >
              {info.nextStep}
            </Button>
          );
        }
        return <span style={{ fontSize: 12, color: colors.textSecondary }}>{info.nextStep}</span>;
      },
    },
  ];

  return (
    <AppShell requiredRole="creator">
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: spacing.md,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <AppText variant="caption" color={colors.textSecondary}>
              {locale === 'ar' ? 'إدارة الأعمال والمخرجات' : 'Track ongoing deliverables'}
            </AppText>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
                {locale === 'ar' ? 'الأعمال النشطة' : 'Active Work'}
              </AppText>
              <Tag tone="live">{`${activeCollabs.length} ${locale === 'ar' ? 'نشط' : 'active'}`}</Tag>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.sm}px ${spacing.md}px`,
              borderRadius: radius.card,
              backgroundColor: colors.surfaceSoft,
            }}
          >
            <AppText variant="dataMonoCaps" color={colors.textSecondary}>
              {locale === 'ar' ? 'إجمالي الضمان النشط:' : 'Total in escrow:'}
            </AppText>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 500,
                fontSize: 15,
                color: colors.primary,
                direction: 'ltr',
              }}
            >
              {formatMoney(escrowBalance)}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: spacing.xs }}>
          <FilterChip
            label={`${locale === 'ar' ? 'نشطة' : 'Active'} (${activeCollabs.length})`}
            selected={filter === 'active'}
            onClick={() => setFilter('active')}
          />
          <FilterChip
            label={`${locale === 'ar' ? 'مكتملة' : 'Completed'} (${completedCollabs.length})`}
            selected={filter === 'completed'}
            onClick={() => setFilter('completed')}
          />
          <FilterChip
            label={`${locale === 'ar' ? 'الكل' : 'All'} (${allCollabs.length})`}
            selected={filter === 'all'}
            onClick={() => setFilter('all')}
          />
        </div>

        {/* Work Table */}
        <QueryStateView
          isLoading={collaborationsQuery.isLoading}
          isError={collaborationsQuery.isError}
          data={filteredCollabs}
          isEmpty={(items) => items.length === 0}
          onRetry={() => {
            collaborationsQuery.refetch();
            earningsQuery.refetch();
          }}
          emptyTitle={locale === 'ar' ? 'لا توجد أعمال حالياً' : 'No collaborations in this view'}
          emptyMessage={
            locale === 'ar'
              ? 'تصفح البريفات المتاحة وقدم عروضك للبدء في إنتاج الفيديوهات.'
              : 'Explore live briefs and submit proposals to start producing deliverables.'
          }
          emptyActionTitle={locale === 'ar' ? 'استكشاف البريفات' : 'Discover briefs'}
          onEmptyAction={() => router.push('/creator/discover')}
        >
          {(items) => (
            <Card elevation="card" style={{ padding: spacing.md, borderRadius: radius.card }}>
              <DataTable
                columns={columns}
                data={items}
                keyExtractor={(item) => item.id}
                onRowClick={(item) => router.push(`/creator/work/${item.id}`)}
              />
            </Card>
          )}
        </QueryStateView>
      </div>
    </AppShell>
  );
}
