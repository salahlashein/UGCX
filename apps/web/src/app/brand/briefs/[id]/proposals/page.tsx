'use client';

import React, { use, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Proposal, ProposalStatus } from '@ugcx/shared-types';
import { AppShell } from '../../../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  FilterChip,
  Icon,
  Kbd,
  Equation,
  Meter,
  ModalSheet,
  QueryStateView,
  SplitPane,
  StatusBadge,
  Tag,
} from '../../../../../components/ui';
import { colors, radius, spacing } from '../../../../../theme/tokens';
import { useCampaign } from '../../../../../hooks/api/useCampaigns';
import { useEscrowBalance } from '../../../../../hooks/api/useEscrow';
import {
  useCampaignProposals,
  useCreatorProfilePreview,
  useProposalQuote,
  useUpdateProposalStatus,
} from '../../../../../hooks/api/useProposals';
import { useAcceptProposal } from '../../../../../hooks/api/useCollaborations';
import { useBrandRole } from '../../../../../hooks/useBrandRole';
import { useKeyboardShortcut } from '../../../../../hooks/useKeyboardShortcut';
import { useTranslation } from '../../../../../i18n';
import { extractErrorMessage } from '../../../../../services/apiHelpers';
import { formatMoney, getInitials } from '../../../../../utils/format';
import { toCents, centsToAmount } from '../../../../../utils/money';
import { compareTags } from '../../../../../utils/proposalTags';
import { EMPTY_VALUE } from '../../../../../utils/labels';

export default function CampaignProposalsInboxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();
  const { can, role: memberRole } = useBrandRole();

  const campaignQuery = useCampaign(campaignId);
  const proposalsQuery = useCampaignProposals(campaignId, { perPage: 100 });
  const escrowQuery = useEscrowBalance(campaignId);

  const updateStatus = useUpdateProposalStatus(campaignId);
  const acceptProposal = useAcceptProposal();

  const [statusFilter, setStatusFilter] = useState<'all' | ProposalStatus>('all');
  const [confirmAccept, setConfirmAccept] = useState<Proposal | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isViewer = memberRole === 'viewer';
  const allProposals = proposalsQuery.data?.data ?? [];

  // Filtered proposals list
  const filteredProposals = useMemo(() => {
    if (statusFilter === 'all') return allProposals;
    return allProposals.filter((p) => p.status === statusFilter);
  }, [allProposals, statusFilter]);

  // Selected proposal ID synced with ?id= URL param
  const urlSelectedId = searchParams.get('id');
  const selectedProposal = useMemo(() => {
    if (urlSelectedId) {
      const match = filteredProposals.find((p) => p.id === urlSelectedId);
      if (match) return match;
    }
    return filteredProposals[0] ?? null;
  }, [filteredProposals, urlSelectedId]);

  const selectProposal = (p: Proposal) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('id', p.id);
    router.replace(`/brand/briefs/${campaignId}/proposals?${next.toString()}`);
  };

  // Keyboard navigation (J moves down, K moves up)
  useKeyboardShortcut('j', (e) => {
    if (filteredProposals.length === 0) return;
    e.preventDefault();
    const currentIndex = filteredProposals.findIndex((p) => p.id === selectedProposal?.id);
    const nextIndex = Math.min(filteredProposals.length - 1, currentIndex + 1);
    selectProposal(filteredProposals[nextIndex]);
  });

  useKeyboardShortcut('k', (e) => {
    if (filteredProposals.length === 0) return;
    e.preventDefault();
    const currentIndex = filteredProposals.findIndex((p) => p.id === selectedProposal?.id);
    const prevIndex = Math.max(0, currentIndex - 1);
    selectProposal(filteredProposals[prevIndex]);
  });

  // Tag comparisons: lowest price, fastest delivery, and top approval
  const proposalTagsMap = useMemo(() => {
    return compareTags(allProposals);
  }, [allProposals]);

  // Creator profile preview for selected proposal
  const previewQuery = useCreatorProfilePreview(selectedProposal?.id);
  const previewProfile = previewQuery.data;

  // Proposal quote (TASK-W3-05, TASK-W3-10)
  const proposalQuoteQuery = useProposalQuote(selectedProposal?.id);
  const proposalQuote = proposalQuoteQuery.data;

  // Counts by status
  const counts = useMemo(() => {
    let applied = 0;
    let shortlisted = 0;
    let accepted = 0;
    let declined = 0;
    for (const p of allProposals) {
      const s = (p.status || '').toLowerCase();
      if (s === 'applied') applied += 1;
      else if (s === 'shortlisted') shortlisted += 1;
      else if (s === 'accepted') accepted += 1;
      else if (s === 'declined') declined += 1;
    }
    return { all: allProposals.length, applied, shortlisted, accepted, declined };
  }, [allProposals]);

  const handleUpdateStatus = async (proposalId: string, status: 'shortlisted' | 'declined') => {
    setActionError(null);
    try {
      await updateStatus.mutateAsync({ proposalId, dto: { status } });
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  };

  const handleConfirmAccept = async () => {
    if (!confirmAccept) return;
    setActionError(null);
    try {
      const res = await acceptProposal.mutateAsync(confirmAccept.id);
      setConfirmAccept(null);
      if (res.status === 'pending_payment' && res.checkoutUrl) {
        window.open(res.checkoutUrl, '_blank', 'noopener,noreferrer');
      }
      router.push(`/brand/collaborations/${res.collaborationId}`);
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  };

  const escrow = escrowQuery.data;
  const availableEscrow = escrow?.available ?? '0.00';
  const fundedEscrow = escrow?.funded ?? '0.00';
  const allocatedEscrow = escrow?.allocated ?? '0.00';

  const availableCents = toCents(availableEscrow);
  const proposalPriceCents = selectedProposal ? toCents(selectedProposal.price) : 0;
  const isEscrowSufficient = availableCents >= proposalPriceCents;

  return (
    <AppShell requiredRole="brand">
      <QueryStateView
        isLoading={campaignQuery.isLoading || proposalsQuery.isLoading || escrowQuery.isLoading}
        isError={campaignQuery.isError || proposalsQuery.isError || escrowQuery.isError}
        data={campaignQuery.data}
        onRetry={() => {
          campaignQuery.refetch();
          proposalsQuery.refetch();
          escrowQuery.refetch();
        }}
      >
        {(brief) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
            {/* Header with Escrow Snapshot */}
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/brand/briefs/${campaignId}`)}
                >
                  ← {locale === 'ar' ? 'البريف' : 'Brief'}
                </Button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
                    {locale === 'ar' ? 'عروض صناع المحتوى' : 'Proposals inbox'}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {brief.title} · {allProposals.length}{' '}
                    {locale === 'ar' ? 'عرض مقدم' : 'received'}
                  </AppText>
                </div>
              </div>

              {/* Escrow Box */}
              <Card
                elevation="card"
                style={{
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  borderRadius: radius.card,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                }}
              >
                <div>
                  <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                    {locale === 'ar' ? 'ضمان الحملة المتاح' : 'Available escrow'}
                  </AppText>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 500,
                      fontSize: 16,
                      color: colors.primary,
                      direction: 'ltr',
                      textAlign: 'start',
                    }}
                  >
                    {formatMoney(availableEscrow)}
                  </div>
                </div>
                <div style={{ width: 80 }}>
                  <Meter
                    segments={[
                      {
                        value: toCents(allocatedEscrow),
                        color: colors.primary,
                        label: 'Allocated',
                      },
                      {
                        value: toCents(availableEscrow),
                        color: colors.accentSoft,
                        label: 'Available',
                      },
                    ]}
                    max={Math.max(1, toCents(fundedEscrow))}
                  />
                </div>
              </Card>
            </div>

            {actionError && (
              <div
                style={{
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  borderRadius: radius.chip,
                  backgroundColor: '#fef2f2',
                  border: `1px solid ${colors.danger}`,
                  color: colors.danger,
                  fontSize: 13,
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {actionError}
              </div>
            )}

            {/* SplitPane Layout */}
            <SplitPane
              minLeftWidth={320}
              left={
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                  {/* Status Filters */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                    <FilterChip
                      label={`${locale === 'ar' ? 'الكل' : 'All'} (${counts.all})`}
                      selected={statusFilter === 'all'}
                      onClick={() => setStatusFilter('all')}
                    />
                    <FilterChip
                      label={`${locale === 'ar' ? 'مقدم' : 'Applied'} (${counts.applied})`}
                      selected={statusFilter === 'applied'}
                      onClick={() => setStatusFilter('applied')}
                    />
                    <FilterChip
                      label={`${locale === 'ar' ? 'مؤهل' : 'Shortlisted'} (${counts.shortlisted})`}
                      selected={statusFilter === 'shortlisted'}
                      onClick={() => setStatusFilter('shortlisted')}
                    />
                    <FilterChip
                      label={`${locale === 'ar' ? 'مقبول' : 'Accepted'} (${counts.accepted})`}
                      selected={statusFilter === 'accepted'}
                      onClick={() => setStatusFilter('accepted')}
                    />
                  </div>

                  {/* Proposals List */}
                  {filteredProposals.length === 0 ? (
                    <Card
                      elevation="card"
                      style={{
                        padding: spacing.xl,
                        textAlign: 'center',
                        borderRadius: radius.card,
                      }}
                    >
                      <AppText variant="bodySmall" color={colors.textSecondary}>
                        {locale === 'ar'
                          ? 'لا توجد عروض في هذه الفئة'
                          : 'No proposals in this view.'}
                      </AppText>
                    </Card>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                      {filteredProposals.map((p) => {
                        const isSelected = selectedProposal?.id === p.id;
                        const creatorName =
                          p.creator?.displayName || (locale === 'ar' ? 'صانع محتوى' : 'Creator');
                        const initials = getInitials(creatorName);

                        return (
                          <div
                            key={p.id}
                            onClick={() => selectProposal(p)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: spacing.md,
                              borderRadius: radius.card,
                              backgroundColor: isSelected ? colors.accentSoft : colors.surface,
                              border: `1px solid ${isSelected ? colors.primary : colors.border}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing.sm,
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: radius.card,
                                  backgroundColor: colors.surface,
                                  color: colors.primary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 500,
                                  fontSize: 13,
                                  flexShrink: 0,
                                }}
                              >
                                {initials}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 500,
                                    fontSize: 14,
                                    color: colors.textPrimary,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {creatorName}
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: colors.textSecondary,
                                    fontFamily: 'var(--font-mono, monospace)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing.xs,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <span>
                                    {p.creator?.city || 'Egypt'} · {p.deliveryDays}d
                                  </span>
                                  {((p as any).creatorStats?.jobsDone ?? 0) > 0 ? (
                                    <>
                                      <span>·</span>
                                      <span style={{ color: colors.primary, fontWeight: 500 }}>
                                        {`${(p as any).creatorStats?.approvalRate ?? 0}%`}{' '}
                                        {locale === 'ar' ? 'قبول' : 'approval'}
                                      </span>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                textAlign: 'end',
                                flexShrink: 0,
                                marginInlineStart: spacing.sm,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: 2,
                              }}
                            >
                              {proposalTagsMap[p.id]?.isTopApproval && (
                                <Tag tone="done">
                                  {locale === 'ar' ? 'أعلى قبول' : 'Top approval'}
                                </Tag>
                              )}
                              <div
                                style={{
                                  fontFamily: 'var(--font-mono, monospace)',
                                  fontWeight: 500,
                                  fontSize: 14,
                                  color: colors.textPrimary,
                                  direction: 'ltr',
                                }}
                              >
                                {formatMoney(p.price)}
                              </div>
                              <StatusBadge status={p.status} domain="custom" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <AppText
                    variant="caption"
                    color={colors.textSecondary}
                    className="ugcx-pointer-only"
                  >
                    {locale === 'ar' ? 'استخدم المفتاحين' : 'Use'} <Kbd>J</Kbd>{' '}
                    {locale === 'ar' ? 'و' : 'and'} <Kbd>K</Kbd>{' '}
                    {locale === 'ar' ? 'للتنقل بين العروض' : 'to move between proposals.'}
                  </AppText>
                </div>
              }
              right={
                selectedProposal ? (
                  <Card
                    elevation="card"
                    style={{
                      padding: spacing.xl,
                      borderRadius: radius.card,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing.lg,
                    }}
                  >
                    {/* Creator Profile Top Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: spacing.md,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: radius.card,
                            backgroundColor: colors.accentSoft,
                            color: colors.primary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 500,
                            fontSize: 20,
                          }}
                        >
                          {getInitials(selectedProposal.creator?.displayName)}
                        </div>
                        <div
                          style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}
                        >
                          <AppText
                            variant="h2"
                            style={{ fontWeight: 500, color: colors.textPrimary }}
                          >
                            {selectedProposal.creator?.displayName || 'Creator'}
                          </AppText>
                          <AppText variant="caption" color={colors.textSecondary}>
                            {selectedProposal.creator?.city || 'Egypt'} ·{' '}
                            {selectedProposal.deliveryDays}{' '}
                            {locale === 'ar' ? 'أيام للتسليم' : 'days delivery'}
                          </AppText>

                          {/* Comparison Tags */}
                          <div style={{ display: 'flex', gap: spacing.xs, marginTop: spacing.xs }}>
                            {proposalTagsMap[selectedProposal.id]?.isLowestPrice && (
                              <Tag tone="done">{locale === 'ar' ? 'أقل سعر' : 'Lowest price'}</Tag>
                            )}
                            {proposalTagsMap[selectedProposal.id]?.isFastestDelivery && (
                              <Tag tone="done">{locale === 'ar' ? 'أسرع تسليم' : 'Fastest'}</Tag>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'end' }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 500,
                            fontSize: 24,
                            color: colors.primary,
                            direction: 'ltr',
                          }}
                        >
                          {formatMoney(selectedProposal.price)}
                        </div>
                        <StatusBadge status={selectedProposal.status} domain="custom" />
                      </div>
                    </div>

                    {/* Creator Stats */}
                    {previewProfile && (
                      <div
                        className="ugcx-stats-row"
                        style={{
                          gap: spacing.md,
                          padding: spacing.md,
                          backgroundColor: colors.surfaceSoft,
                          borderRadius: radius.card,
                          textAlign: 'center',
                        }}
                      >
                        <div>
                          <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                            {locale === 'ar' ? 'أعمال مكتملة' : 'Jobs done'}
                          </AppText>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono, monospace)',
                              fontWeight: 500,
                              fontSize: 16,
                              marginTop: 2,
                            }}
                          >
                            {previewProfile.jobsDone ??
                              (previewProfile as any).jobsCompletedCount ??
                              0}
                          </div>
                        </div>
                        <div>
                          <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                            {locale === 'ar' ? 'نسبة القبول' : 'Approval rate'}
                          </AppText>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono, monospace)',
                              fontWeight: 500,
                              fontSize: 16,
                              marginTop: 2,
                              color: colors.primary,
                            }}
                          >
                            {(previewProfile.jobsDone ?? 0) > 0
                              ? `${previewProfile.approvalRate ?? 0}%`
                              : EMPTY_VALUE}
                          </div>
                        </div>
                        <div>
                          <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                            {locale === 'ar' ? 'متوسط التعديلات' : 'Avg revisions'}
                          </AppText>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono, monospace)',
                              fontWeight: 500,
                              fontSize: 16,
                              marginTop: 2,
                            }}
                          >
                            {previewProfile.averageRevisions ?? 0}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pitch Section */}
                    <div>
                      <AppText
                        variant="dataMonoCaps"
                        color={colors.textSecondary}
                        style={{ marginBottom: spacing.xs, display: 'block' }}
                      >
                        {locale === 'ar' ? 'نبذة العرض وطريقة التنفيذ' : 'Pitch'}
                      </AppText>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          lineHeight: 1.6,
                          color: colors.textPrimary,
                          backgroundColor: colors.canvas,
                          padding: spacing.md,
                          borderRadius: radius.card,
                          fontStyle: 'italic',
                        }}
                        dir="auto"
                      >
                        {selectedProposal.pitch}
                      </p>
                    </div>

                    {/* Portfolio Gallery (Total count) */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: spacing.xs,
                        }}
                      >
                        <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                          {locale === 'ar' ? 'معرض الأعمال' : 'Portfolio'}
                        </AppText>
                        <span
                          style={{
                            fontSize: 12,
                            fontFamily: 'var(--font-mono, monospace)',
                            color: colors.textSecondary,
                          }}
                        >
                          {`${previewProfile?.portfolio?.length ?? 0} ${locale === 'ar' ? 'من' : 'of'} ${previewProfile?.portfolioCount || (selectedProposal as any).portfolioCount || previewProfile?.portfolio?.length || 0}`}
                        </span>
                      </div>
                      {previewProfile?.portfolio && previewProfile.portfolio.length > 0 ? (
                        <div className="ugcx-thumb-row" style={{ gap: spacing.xs }}>
                          {previewProfile.portfolio.map((item: any) => (
                            <div
                              key={item.id}
                              style={{
                                aspectRatio: '9/16',
                                borderRadius: radius.card,
                                backgroundColor: colors.surface,
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              {item.thumbnailUrl ? (
                                <img
                                  src={item.thumbnailUrl}
                                  alt="Portfolio"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <Icon name="video" size={20} />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <AppText variant="caption" color={colors.textTertiary}>
                          {locale === 'ar'
                            ? 'لا توجد أعمال في المعرض'
                            : 'No portfolio items uploaded.'}
                        </AppText>
                      )}
                    </div>

                    {/* Escrow Allocation Impact */}
                    {selectedProposal.status !== 'declined' && (
                      <div
                        style={{
                          padding: spacing.md,
                          borderTop: `1px dashed ${colors.border}`,
                          borderBottom: `1px dashed ${colors.border}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: spacing.xs,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                            {locale === 'ar' ? 'في حال قبول هذا العرض' : 'If you accept'}
                          </AppText>
                          {proposalQuote && !proposalQuote.sufficient && (
                            <span
                              style={{
                                color: colors.danger,
                                fontSize: 12,
                                fontWeight: 500,
                              }}
                            >
                              {locale === 'ar'
                                ? `عجز بمقدار ${formatMoney(proposalQuote.shortfall)}`
                                : `Short by ${formatMoney(proposalQuote.shortfall)}`}
                            </span>
                          )}
                        </div>
                        {/* Three terms on one row, the way the studio reads:
                            escrow now, this proposal, what is left. */}
                        <Equation
                          items={[
                            {
                              label: locale === 'ar' ? 'الرصيد الآن' : 'Escrow now',
                              value: proposalQuote?.available ?? availableEscrow,
                            },
                            { label: '−' },
                            {
                              label: locale === 'ar' ? 'هذا العرض' : 'This proposal',
                              value: proposalQuote?.totalAmount ?? selectedProposal.price,
                            },
                            { label: '=' },
                            {
                              label: locale === 'ar' ? 'المتبقي' : 'Left after accept',
                              value: proposalQuote?.availableAfter ?? undefined,
                              highlight: true,
                            },
                          ]}
                        />

                        {proposalQuote ? (
                          <AppText variant="caption" color={colors.textSecondary}>
                            {locale === 'ar'
                              ? `السعر ${formatMoney(proposalQuote.creatorPrice)} زائد رسوم المنصة ${formatMoney(proposalQuote.platformFee)}.`
                              : `Creator price ${formatMoney(proposalQuote.creatorPrice)} plus the platform fee ${formatMoney(proposalQuote.platformFee)}.`}
                          </AppText>
                        ) : null}

                        {proposalQuote && !proposalQuote.sufficient && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/brand/briefs/${campaignId}/fund?topup=${encodeURIComponent(proposalQuote.shortfall)}`,
                              )
                            }
                            style={{ alignSelf: 'flex-start' }}
                          >
                            {locale === 'ar' ? 'شحن رصيد الضمان' : 'Top up escrow'}
                          </Button>
                        )}
                        <AppText variant="caption" color={colors.textTertiary}>
                          {locale === 'ar'
                            ? 'لا توجد رسوم إضافية. يتم حجز المبلغ مباشرة من رصيد ضمان الحملة.'
                            : 'No new charge. The amount moves from campaign escrow to this collaboration.'}
                        </AppText>
                      </div>
                    )}

                    {/* Action Bar */}
                    {!isViewer && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: spacing.sm,
                        }}
                      >
                        {selectedProposal.status === 'applied' && can('acceptProposal') && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(selectedProposal.id, 'declined')}
                              loading={updateStatus.isPending}
                            >
                              {locale === 'ar' ? 'رفض' : 'Decline'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUpdateStatus(selectedProposal.id, 'shortlisted')}
                              loading={updateStatus.isPending}
                            >
                              {locale === 'ar' ? 'تأهيل' : 'Shortlist'}
                            </Button>
                          </>
                        )}

                        {selectedProposal.status === 'shortlisted' && can('acceptProposal') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(selectedProposal.id, 'declined')}
                            loading={updateStatus.isPending}
                          >
                            {locale === 'ar' ? 'رفض' : 'Decline'}
                          </Button>
                        )}

                        {(selectedProposal.status === 'applied' ||
                          selectedProposal.status === 'shortlisted') &&
                          can('acceptProposal') && (
                            <Button
                              variant="primary"
                              onClick={() => setConfirmAccept(selectedProposal)}
                            >
                              {locale === 'ar' ? 'قبول العرض وبدء العمل' : 'Accept proposal'}
                            </Button>
                          )}

                        {selectedProposal.status === 'accepted' && (
                          <Button variant="secondary" onClick={() => router.push('/brand/chats')}>
                            <Icon name="chat" size={14} />
                            <span>
                              {locale === 'ar' ? 'محادثة صانع المحتوى' : 'Message creator'}
                            </span>
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                ) : (
                  <Card
                    elevation="card"
                    style={{ padding: spacing.xl, textAlign: 'center', borderRadius: radius.card }}
                  >
                    <AppText variant="bodySmall" color={colors.textSecondary}>
                      {locale === 'ar'
                        ? 'اختر عرضاً من القائمة لعرض التفاصيل'
                        : 'Select a proposal to view details.'}
                    </AppText>
                  </Card>
                )
              }
            />

            {/* Accept Confirmation Modal */}
            <ModalSheet
              isOpen={!!confirmAccept}
              onClose={() => setConfirmAccept(null)}
              title={locale === 'ar' ? 'تأكيد قبول العرض' : 'Accept proposal'}
            >
              {confirmAccept && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.lg,
                    padding: spacing.md,
                  }}
                >
                  <AppText variant="bodySmall" color={colors.textPrimary}>
                    {locale === 'ar'
                      ? `هل تريد قبول عرض ${confirmAccept.creator?.displayName || 'صانع المحتوى'} بقيمة ${formatMoney(confirmAccept.price)}؟`
                      : `Do you want to accept the proposal from ${confirmAccept.creator?.displayName || 'the creator'} for ${formatMoney(confirmAccept.price)}?`}
                  </AppText>

                  <div
                    style={{
                      padding: spacing.md,
                      backgroundColor: colors.surfaceSoft,
                      borderRadius: radius.card,
                    }}
                  >
                    <AppText variant="caption" color={colors.textSecondary}>
                      {locale === 'ar'
                        ? 'لا يتم خصم أي مبالغ جديدة. يتم تخصيص القيمة مباشرة من رصيد ضمان الحملة المسدد مسبقاً.'
                        : 'No new charge. The amount moves directly from campaign escrow.'}
                    </AppText>
                  </div>

                  {!isEscrowSufficient && (
                    <div
                      style={{
                        padding: spacing.md,
                        backgroundColor: '#fef2f2',
                        borderRadius: radius.card,
                        border: `1px solid ${colors.danger}`,
                        color: colors.danger,
                        fontSize: 13,
                      }}
                    >
                      {locale === 'ar'
                        ? 'رصيد ضمان الحملة غير كافٍ لتغطية هذا العرض. يرجى شحن رصيد الضمان أولاً.'
                        : 'Campaign escrow is insufficient to cover this proposal. Please top up escrow first.'}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.sm }}>
                    <Button variant="secondary" onClick={() => setConfirmAccept(null)}>
                      {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleConfirmAccept}
                      loading={acceptProposal.isPending}
                    >
                      {locale === 'ar' ? 'تأكيد وبدء التعاون' : 'Confirm and start'}
                    </Button>
                  </div>
                </div>
              )}
            </ModalSheet>
          </div>
        )}
      </QueryStateView>
    </AppShell>
  );
}
