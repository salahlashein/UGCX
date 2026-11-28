'use client';

import React, { useMemo } from 'react';
import { pendingManualPayment } from '../../../utils/pendingPayment';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  GroupHeader,
  Icon,
  ListRow,
  QueryStateView,
  StatusBadge,
  Tag,
} from '../../../components/ui';
import { colors, radius, spacing } from '../../../theme/tokens';
import { useMyBriefs } from '../../../hooks/api/useCampaigns';
import { useMyCollaborations } from '../../../hooks/api/useCollaborations';
import { useBrandRole } from '../../../hooks/useBrandRole';
import { useBrandProfile } from '../../../hooks/api/useBrand';
import { useTranslation } from '../../../i18n';
import { formatMoney, getInitials } from '../../../utils/format';

export default function BrandProposalsOverviewPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const brandName = useBrandProfile().data?.companyName?.trim() || null;
  const { can, role: memberRole } = useBrandRole();

  const briefsQuery = useMyBriefs('all');
  const collaborationsQuery = useMyCollaborations();

  const isViewer = memberRole === 'viewer';
  const briefs = briefsQuery.data?.data ?? [];
  const collabs = (collaborationsQuery.data as any)?.data || collaborationsQuery.data || [];

  return (
    <AppShell requiredRole="brand">
      <QueryStateView
        isLoading={briefsQuery.isLoading}
        isError={briefsQuery.isError}
        data={briefsQuery.data}
        onRetry={() => {
          briefsQuery.refetch();
          collaborationsQuery.refetch();
        }}
      >
        {() => (
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
                  {brandName
                    ? locale === 'ar'
                      ? `عروض ${brandName}`
                      : `Proposals for ${brandName}`
                    : locale === 'ar'
                      ? 'استقبال وإدارة عروض الصناع'
                      : 'Creator proposals by brief'}
                </AppText>
                <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
                  {locale === 'ar' ? 'العروض المقدمة' : 'Proposals'}
                </AppText>
              </div>

              {!isViewer && can('createBrief') && (
                <Button variant="primary" onClick={() => router.push('/brand/briefs/new')}>
                  <Icon name="plus" size={16} />
                  <span>{locale === 'ar' ? 'إنشاء بريف جديد' : 'New brief'}</span>
                </Button>
              )}
            </div>

            {/* Briefs Cards Grid */}
            <div>
              <GroupHeader
                title={locale === 'ar' ? 'حسب البريف' : 'By brief'}
                count={briefs.length}
              />

              {briefs.length === 0 ? (
                <Card
                  elevation="card"
                  style={{ padding: spacing.xl, textAlign: 'center', borderRadius: radius.card }}
                >
                  <AppText variant="bodySmall" color={colors.textSecondary}>
                    {locale === 'ar'
                      ? 'لا توجد بريفات حالياً. أنشئ بريفك الأول للبدء في استقبال العروض.'
                      : 'No briefs yet. Create a brief to start receiving proposals.'}
                  </AppText>
                </Card>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: spacing.lg,
                  }}
                >
                  {briefs.map((b) => {
                    const hasProposals = (b.proposalCount ?? 0) > 0;
                    const isDraft = b.status === 'draft';

                    return (
                      <Card
                        key={b.id}
                        elevation="card"
                        style={{
                          padding: spacing.lg,
                          borderRadius: radius.card,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: spacing.md,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <StatusBadge status={b.status} domain="campaign" />
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                            {hasProposals && (
                              <Tag tone="live">{`${b.totalProposals ?? b.proposalCount} ${locale === 'ar' ? 'عرض' : 'proposals'}`}</Tag>
                            )}
                            {(b.appliedCount ?? 0) > 0 && (
                              <Tag tone="accent">{`+${b.appliedCount} ${locale === 'ar' ? 'جديد' : 'new'}`}</Tag>
                            )}
                          </div>
                        </div>

                        <div>
                          <AppText
                            variant="subtitle"
                            style={{ fontWeight: 500, color: colors.textPrimary }}
                          >
                            {b.title}
                          </AppText>
                        </div>

                        {/* Metric Strip */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: spacing.xs,
                            padding: spacing.sm,
                            backgroundColor: colors.surfaceSoft,
                            borderRadius: radius.card,
                            textAlign: 'center',
                          }}
                        >
                          <div>
                            <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                              {locale === 'ar' ? 'أقل عرض مفتوح' : 'Lowest open'}
                            </AppText>
                            <div
                              style={{
                                fontFamily: 'var(--font-mono, monospace)',
                                fontWeight: 500,
                                fontSize: 12,
                                direction: 'ltr',
                                marginTop: 2,
                              }}
                            >
                              {b.lowestPrice ? formatMoney(b.lowestPrice) : '-'}
                            </div>
                          </div>
                          <div>
                            <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                              {locale === 'ar' ? 'المؤهلون' : 'Shortlisted'}
                            </AppText>
                            <div
                              style={{
                                fontFamily: 'var(--font-mono, monospace)',
                                fontWeight: 500,
                                fontSize: 13,
                                marginTop: 2,
                              }}
                            >
                              {b.shortlistedCount ?? 0}
                            </div>
                          </div>
                          <div>
                            <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                              {locale === 'ar' ? 'المتعاقدون' : 'Hired'}
                            </AppText>
                            <div
                              style={{
                                fontFamily: 'var(--font-mono, monospace)',
                                fontWeight: 500,
                                fontSize: 13,
                                marginTop: 2,
                              }}
                            >
                              {b.hiredCount ?? 0}
                            </div>
                          </div>
                        </div>

                        {/* Card Action */}
                        <div
                          style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}
                        >
                          {hasProposals ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => router.push(`/brand/briefs/${b.id}/proposals`)}
                            >
                              <span>{locale === 'ar' ? 'صندوق العروض' : 'Open inbox'}</span> →
                            </Button>
                          ) : isDraft && pendingManualPayment(b) ? (
                            // Transfer submitted, admin checking it (UI audit G8).
                            <Tag tone="info">
                              {locale === 'ar' ? 'الدفع بيتراجع' : 'Payment being checked'}
                            </Tag>
                          ) : isDraft && !isViewer && can('fundEscrow') ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => router.push(`/brand/briefs/${b.id}/fund`)}
                            >
                              {locale === 'ar' ? 'تمويل الضمان' : 'Fund escrow'}
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => router.push(`/brand/briefs/${b.id}`)}
                            >
                              {locale === 'ar' ? 'عرض البريف' : 'View brief'}
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Collaborations Section */}
            {collabs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                <GroupHeader
                  title={locale === 'ar' ? 'التعاونات النشطة' : 'Collaborations in progress'}
                  count={collabs.length}
                />

                <Card elevation="card" style={{ padding: spacing.md, borderRadius: radius.card }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                    {collabs.map((c: any) => (
                      <ListRow
                        key={c.id}
                        title={c.campaign?.title || 'Collaboration'}
                        subtitle={
                          c.creator?.displayName || (locale === 'ar' ? 'صانع محتوى' : 'Creator')
                        }
                        // The shared status words, not raw tone names (UI audit brand-proposals/C1).
                        tag={
                          <StatusBadge
                            status={c.status}
                            domain="collaboration"
                            label={
                              c.status === 'delivered'
                                ? locale === 'ar'
                                  ? 'الفيديو جاهز للمراجعة'
                                  : 'Video ready for review'
                                : undefined
                            }
                          />
                        }
                        action={
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono, monospace)',
                                fontWeight: 500,
                                fontSize: 13,
                                color: colors.primary,
                                direction: 'ltr',
                              }}
                            >
                              {formatMoney(c.creatorPrice)}
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => router.push(`/brand/collaborations/${c.id}`)}
                            >
                              {locale === 'ar' ? 'متابعة' : 'Track'} →
                            </Button>
                          </div>
                        }
                      />
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </QueryStateView>
    </AppShell>
  );
}
