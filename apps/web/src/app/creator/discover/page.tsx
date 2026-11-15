'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Niche } from '@ugcx/shared-types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  FilterChip,
  Icon,
  ListRow,
  LoadingState,
  QueryStateView,
  SegmentedControl,
  Tag,
  TextInput,
} from '../../../components/ui';
import { colors, radius, spacing } from '../../../theme/tokens';
import { useLiveCampaigns } from '../../../hooks/api/useCampaigns';
import { useTranslation } from '../../../i18n';
import { formatAmount, formatMoney } from '../../../utils/format';
import { languageLabel, plural } from '../../../utils/labels';

const NICHES: { key: Niche; labelEn: string; labelAr: string }[] = [
  { key: 'beauty_personal_care', labelEn: 'Beauty & Care', labelAr: 'الجمال والعناية' },
  { key: 'fashion', labelEn: 'Fashion', labelAr: 'الأزياء والموضة' },
  { key: 'food_fmcg', labelEn: 'Food & FMCG', labelAr: 'الأغذية والمشروبات' },
  { key: 'mom_baby', labelEn: 'Mom & Baby', labelAr: 'الأم والطفل' },
  { key: 'home_lifestyle', labelEn: 'Home & Lifestyle', labelAr: 'المنزل ونمط الحياة' },
  { key: 'other', labelEn: 'Other', labelAr: 'أخرى' },
];

function CreatorDiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();

  // Read URL query parameters
  const qParam = searchParams.get('q') || '';
  const nicheParam = searchParams.get('niche') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const maxBudgetParam = searchParams.get('maxBudget') || '';
  const needsShippingParam = searchParams.get('needsShipping') || '';

  const [searchInput, setSearchInput] = useState(qParam);

  const selectedNiches = useMemo(() => {
    return nicheParam ? nicheParam.split(',').filter(Boolean) : [];
  }, [nicheParam]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === 'all' || val === '' || val === 'newest') {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    }
    router.replace(`/creator/discover${next.toString() ? `?${next.toString()}` : ''}`);
  };

  const toggleNiche = (nicheKey: string) => {
    let nextList: string[];
    if (selectedNiches.includes(nicheKey)) {
      nextList = selectedNiches.filter((k) => k !== nicheKey);
    } else {
      nextList = [...selectedNiches, nicheKey].slice(0, 6);
    }
    updateFilters({ niche: nextList.length > 0 ? nextList.join(',') : null });
  };

  const campaignsQuery = useLiveCampaigns({
    q: qParam || undefined,
    niche: nicheParam ? (nicheParam as any) : undefined,
    sort: (sortParam as any) || undefined,
    maxBudget: maxBudgetParam ? Number(maxBudgetParam) : undefined,
    needsShipping: needsShippingParam ? needsShippingParam === 'true' : undefined,
  });

  const campaigns = campaignsQuery.data?.data || [];
  const facetMap = useMemo(() => {
    const map = new Map<string, number>();
    const facets = (campaignsQuery.data?.meta as any)?.facets?.niches || [];
    for (const f of facets) {
      map.set(f.value, f.count);
    }
    return map;
  }, [campaignsQuery.data?.meta]);

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
              {locale === 'ar' ? 'استكشاف الحملات والبريفات المتاحة' : 'Discover live briefs'}
            </AppText>
            <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
              {locale === 'ar' ? 'البريفات المتاحة' : 'Live briefs'}
            </AppText>
          </div>

          {/* Sort chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <FilterChip
              label={locale === 'ar' ? 'الأحدث' : 'Newest'}
              selected={sortParam === 'newest'}
              onClick={() => updateFilters({ sort: 'newest' })}
            />
            <FilterChip
              label={locale === 'ar' ? 'أعلى ميزانية' : 'Highest budget'}
              selected={sortParam === 'budget'}
              onClick={() => updateFilters({ sort: 'budget' })}
            />
            <FilterChip
              label={locale === 'ar' ? 'ينتهي قريباً' : 'Closing soon'}
              selected={sortParam === 'closing'}
              onClick={() => updateFilters({ sort: 'closing' })}
            />
          </div>
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <div style={{ flex: 1 }}>
            <TextInput
              placeholder={
                locale === 'ar' ? 'بحث عن بريف أو علامة تجارية...' : 'Search briefs or brands...'
              }
              value={searchInput}
              onChangeText={setSearchInput}
            />
          </div>
          <Button variant="secondary" onClick={() => updateFilters({ q: searchInput.trim() })}>
            <Icon name="search" size={16} />
            <span>{locale === 'ar' ? 'بحث' : 'Search'}</span>
          </Button>
        </div>

        {/* 2-Column Discover Layout: Filter Panel at inline-start */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 280px) minmax(0, 1fr)',
            gap: spacing.xl,
            alignItems: 'start',
          }}
        >
          {/* Filters Card */}
          <Card
            elevation="card"
            style={{
              padding: spacing.lg,
              borderRadius: radius.card,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.lg,
            }}
          >
            {/* Niche Multi-Select with counts */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: spacing.sm,
                }}
              >
                <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                  {locale === 'ar' ? 'المجالات' : 'Niches'}
                </AppText>
                {selectedNiches.length > 0 && (
                  <button
                    type="button"
                    onClick={() => updateFilters({ niche: null })}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: colors.primary,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    {locale === 'ar' ? 'مسح' : 'Clear'}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                {NICHES.map((n) => {
                  const isSelected = selectedNiches.includes(n.key);
                  const count = facetMap.get(n.key) ?? 0;

                  return (
                    <button
                      key={n.key}
                      type="button"
                      onClick={() => toggleNiche(n.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: `${spacing.xs}px ${spacing.sm}px`,
                        borderRadius: radius.chip,
                        border: 'none',
                        backgroundColor: isSelected ? colors.accentSoft : 'transparent',
                        color: isSelected ? colors.primary : colors.textPrimary,
                        fontWeight: isSelected ? 500 : 400,
                        fontSize: 13,
                        cursor: 'pointer',
                        textAlign: 'start',
                      }}
                    >
                      <span>{locale === 'ar' ? n.labelAr : n.labelEn}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono, monospace)',
                          color: isSelected ? colors.primary : colors.textSecondary,
                        }}
                      >
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Shipping Filter */}
            <div style={{ borderTop: `1px dashed ${colors.border}`, paddingTop: spacing.md }}>
              <AppText
                variant="dataMonoCaps"
                color={colors.textSecondary}
                style={{ marginBottom: spacing.sm, display: 'block' }}
              >
                {locale === 'ar' ? 'شحن المنتج' : 'Shipping'}
              </AppText>
              <SegmentedControl
                options={[
                  { label: locale === 'ar' ? 'الكل' : 'All', value: 'all' },
                  { label: locale === 'ar' ? 'يتطلب شحن' : 'Ships', value: 'true' },
                  { label: locale === 'ar' ? 'بدون شحن' : 'Digital', value: 'false' },
                ]}
                value={needsShippingParam || 'all'}
                onChange={(val) => updateFilters({ needsShipping: val === 'all' ? null : val })}
              />
            </div>

            {/* Maximum Budget Filter */}
            <div style={{ borderTop: `1px dashed ${colors.border}`, paddingTop: spacing.md }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: spacing.xs,
                }}
              >
                <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                  {locale === 'ar' ? 'أقصى ميزانية' : 'Max budget'}
                </AppText>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 12,
                    color: colors.primary,
                    fontWeight: 500,
                    direction: 'ltr',
                  }}
                >
                  {maxBudgetParam
                    ? formatMoney(maxBudgetParam)
                    : locale === 'ar'
                      ? 'أي ميزانية'
                      : 'Any'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25000"
                step="1000"
                value={maxBudgetParam || 0}
                onChange={(e) =>
                  updateFilters({ maxBudget: e.target.value === '0' ? null : e.target.value })
                }
                style={{
                  width: '100%',
                  accentColor: colors.primary,
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Clear All Filters */}
            {(selectedNiches.length > 0 || qParam || needsShippingParam || maxBudgetParam) && (
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => {
                  setSearchInput('');
                  updateFilters({
                    q: null,
                    niche: null,
                    needsShipping: null,
                    maxBudget: null,
                    sort: null,
                  });
                }}
              >
                {locale === 'ar' ? 'إعادة تعيين الفلاتر' : 'Clear filters'}
              </Button>
            )}
          </Card>

          {/* Results List */}
          <QueryStateView
            isLoading={campaignsQuery.isLoading}
            isError={campaignsQuery.isError}
            data={campaigns}
            isEmpty={(items) => items.length === 0}
            onRetry={() => campaignsQuery.refetch()}
            emptyTitle={locale === 'ar' ? 'لا توجد بريفات تطابق الفلاتر' : 'No matching briefs'}
            emptyMessage={
              locale === 'ar'
                ? 'جرب تغيير خيارات الفلترة أو إعادة تعيينها لعرض المزيد من البريفات.'
                : 'Try adjusting your filters or clearing them to see more available briefs.'
            }
          >
            {(items) => {
              // "Few proposals" is a comparison. It is only worth showing when
              // the list holds busier briefs too.
              const counts = items.map((x) => (x as any).proposalCount ?? 0);
              const quiet = counts.filter((c) => c <= 2).length;
              const competitionVaries =
                counts.length > 1 && quiet > 0 && quiet <= counts.length / 2;

              return (
                <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                    {items.map((b) => {
                      const daysLeft = b.closesAt
                        ? Math.max(
                            0,
                            Math.ceil(
                              (new Date(b.closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                            ),
                          )
                        : null;

                      const proposalCount = (b as any).proposalCount ?? 0;
                      // A tag on every row says nothing, so it shows only when the
                      // list actually has busier briefs to compare against.
                      const isFewProposals = competitionVaries && proposalCount <= 2;

                      return (
                        <ListRow
                          key={b.id}
                          title={b.title}
                          subtitle={[
                            (b as any).brand?.companyName ||
                              (locale === 'ar' ? 'علامة تجارية' : 'Brand'),
                            `${b.durationSeconds}s`,
                            languageLabel(b.language, locale),
                            b.needsShipping
                              ? locale === 'ar'
                                ? 'شحن منتج'
                                : 'Ships product'
                              : null,
                            daysLeft !== null
                              ? locale === 'ar'
                                ? `${daysLeft} يوم متبقٍ`
                                : `${daysLeft}d left`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                          action={
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                              {isFewProposals && (
                                <Tag tone="pend">
                                  {locale === 'ar' ? 'عروض قليلة' : 'Few proposals'}
                                </Tag>
                              )}
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono, monospace)',
                                  fontWeight: 500,
                                  fontSize: 14,
                                  color: colors.textPrimary,
                                  direction: 'ltr',
                                }}
                              >
                                {formatMoney(b.budgetMin)} – {formatAmount(b.budgetMax)}
                              </span>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => router.push(`/creator/discover/${b.id}`)}
                              >
                                {locale === 'ar' ? 'تقديم عرض' : 'Apply'}
                              </Button>
                            </div>
                          }
                        />
                      );
                    })}
                  </div>
                </Card>
              );
            }}
          </QueryStateView>
        </div>
      </div>
    </AppShell>
  );
}

export default function CreatorDiscoverPage() {
  return (
    <React.Suspense fallback={<LoadingState />}>
      <CreatorDiscoverContent />
    </React.Suspense>
  );
}
