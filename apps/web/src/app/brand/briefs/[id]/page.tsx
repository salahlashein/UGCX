'use client';

import React, { use, useState, useMemo } from 'react';
import { pendingManualPayment } from '../../../../utils/pendingPayment';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  HStepper,
  Icon,
  KeyValueList,
  KpiCells,
  Meter,
  ModalSheet,
  QueryStateView,
  StatusBadge,
  Tag,
  TextInput,
} from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import { useCampaign, usePauseBrief, useResumeBrief } from '../../../../hooks/api/useCampaigns';
import { useCloseBrief, useEscrowBalance } from '../../../../hooks/api/useEscrow';
import { useCampaignProposals } from '../../../../hooks/api/useProposals';
import { useMyCollaborations } from '../../../../hooks/api/useCollaborations';
import { useBrandRole } from '../../../../hooks/useBrandRole';
import { useBrandProfile } from '../../../../hooks/api/useBrand';
import { useTranslation } from '../../../../i18n';
import { extractErrorMessage } from '../../../../services/apiHelpers';
import { formatDateShort, formatMoney, formatRef } from '../../../../utils/format';
import { toCents } from '../../../../utils/money';
import { lifecycleSteps } from '../../../../utils/briefLifecycle';
import { languageLabel, plural, videoTypeLabel } from '../../../../utils/labels';

export default function BriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = use(params);
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { can, role: memberRole } = useBrandRole();

  const campaignQuery = useCampaign(campaignId);
  const escrowQuery = useEscrowBalance(campaignId);
  const proposalsQuery = useCampaignProposals(campaignId, { perPage: 100 });
  const collabsQuery = useMyCollaborations();
  const brandProfileQuery = useBrandProfile();

  const pauseBrief = usePauseBrief();
  const resumeBrief = useResumeBrief();
  const closeBrief = useCloseBrief(campaignId);

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const isViewer = memberRole === 'viewer';
  const campaign = campaignQuery.data;

  // Filter collaborations for this campaign
  const campaignCollabs = useMemo(() => {
    const list = collabsQuery.data?.data || [];
    return list.filter((c: any) => c.campaignId === campaignId);
  }, [collabsQuery.data, campaignId]);

  // Derive 6 lifecycle steps
  const steps = useMemo(() => {
    if (!campaign) return [];
    return lifecycleSteps(campaign, campaignCollabs);
  }, [campaign, campaignCollabs]);

  const escrow = escrowQuery.data;
  const availableEscrow = escrow?.available ?? '0.00';
  const fundedEscrow = escrow?.funded ?? '0.00';
  const allocatedEscrow = escrow?.allocated ?? '0.00';

  const proposals = proposalsQuery.data?.data || [];
  const openProposalsCount = proposals.filter((p) => p.status === 'applied').length;
  // Total plus waiting, the same numbers as the inbox and the briefs list
  // (UI audit brand-brief-detail/C1).
  const totalProposalsCount = proposalsQuery.data?.meta?.total ?? proposals.length;
  const hiredCount = campaignCollabs.filter(
    (c: any) => c.status !== 'cancelled' && c.status !== 'pending_payment',
  ).length;
  const totalSlots = campaign?.slots || 1;

  const handleCloseBrief = async () => {
    setActionError(null);
    try {
      await closeBrief.mutateAsync({ reason: closeReason.trim() || undefined });
      setCloseModalOpen(false);
      campaignQuery.refetch();
      escrowQuery.refetch();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  };

  return (
    <AppShell requiredRole="brand">
      <QueryStateView
        isLoading={campaignQuery.isLoading || escrowQuery.isLoading}
        isError={campaignQuery.isError || escrowQuery.isError}
        data={campaignQuery.data}
        onRetry={() => {
          campaignQuery.refetch();
          escrowQuery.refetch();
          proposalsQuery.refetch();
          collabsQuery.refetch();
        }}
      >
        {(brief) => {
          // GET /campaigns/:id returns the bare row to the owning brand, with
          // no joined brand. Read the company name from the brand profile.
          const brandName =
            (brief as any).brand?.companyName ||
            brandProfileQuery.data?.companyName ||
            (locale === 'ar' ? 'العلامة التجارية' : 'Brand');
          const daysLeft = brief.closesAt
            ? Math.max(
                0,
                Math.ceil(
                  (new Date(brief.closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                ),
              )
            : null;

          return (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/brand/briefs')}
                  >
                    {locale === 'ar' ? '→ كل البريفات' : '← Briefs'}
                  </Button>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
                        {brief.title}
                      </AppText>
                      <StatusBadge status={brief.status} domain="campaign" />
                    </div>
                    <AppText variant="caption" color={colors.textSecondary}>
                      <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                        {formatRef(brief.id)}
                      </span>{' '}
                      · {brandName}
                      {daysLeft !== null &&
                        brief.status !== 'completed' &&
                        brief.status !== 'cancelled' &&
                        ` · ${plural(daysLeft, locale === 'ar' ? 'يوم متبقي' : 'day left', locale === 'ar' ? 'يوم متبقي' : 'days left', locale)}`}
                    </AppText>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    flexWrap: 'wrap',
                  }}
                >
                  {can('editBrief') && (
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/brand/briefs/${brief.id}/edit`)}
                    >
                      <Icon name="edit" size={14} />
                      <span>{locale === 'ar' ? 'تعديل البريف' : 'Edit brief'}</span>
                    </Button>
                  )}
                  {/* Proposals Shortcut */}
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/brand/briefs/${brief.id}/proposals`)}
                  >
                    <Icon name="inbox" size={16} />
                    <span>
                      {locale === 'ar' ? 'العروض' : 'Proposals'} ({totalProposalsCount})
                    </span>
                  </Button>
                </div>
              </div>

              {/* Lifecycle Progress Bar */}
              <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
                <HStepper steps={steps} />
              </Card>

              {/* 2-Column Document & Side Panel */}
              <div
                className="ugcx-two-column-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)',
                  gap: spacing.xl,
                  alignItems: 'start',
                }}
              >
                {/* Left Column: Printed Brief Document */}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                      {brandName} · {locale === 'ar' ? 'وثيقة البريف' : 'Brief document'}
                    </AppText>
                    <AppText
                      variant="h2"
                      style={{ fontWeight: 500, color: colors.textPrimary, marginTop: spacing.xs }}
                    >
                      {brief.title}
                    </AppText>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      lineHeight: 1.7,
                      color: colors.textPrimary,
                    }}
                  >
                    {brief.brief}
                  </p>

                  {/* Format & Requirements */}
                  <div style={{ borderTop: `1px dashed ${colors.border}`, paddingTop: spacing.md }}>
                    <AppText
                      variant="dataMonoCaps"
                      color={colors.textSecondary}
                      style={{ marginBottom: spacing.sm, display: 'block' }}
                    >
                      {locale === 'ar' ? 'المواصفات الفنية' : 'Format specifications'}
                    </AppText>
                    <KeyValueList
                      items={[
                        {
                          key: locale === 'ar' ? 'نوع الفيديو' : 'Video type',
                          value: videoTypeLabel(brief.videoType, locale),
                        },
                        {
                          key: locale === 'ar' ? 'المدة' : 'Duration',
                          value: `${brief.durationSeconds}s`,
                        },
                        {
                          key: locale === 'ar' ? 'اللغة' : 'Language',
                          value: languageLabel(brief.language, locale),
                        },
                        {
                          key: locale === 'ar' ? 'شحن المنتج' : 'Product shipping',
                          value: brief.needsShipping
                            ? locale === 'ar'
                              ? 'مطلوب شحن عينة المنتج'
                              : 'Sample shipment required'
                            : locale === 'ar'
                              ? 'غير مطلوب'
                              : 'Not required',
                        },
                        {
                          key: locale === 'ar' ? 'نطاق الميزانية' : 'Budget range',
                          value: (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono, monospace)',
                                direction: 'ltr',
                                display: 'block',
                                textAlign: locale === 'ar' ? 'left' : 'right',
                              }}
                            >
                              {formatMoney(brief.budgetMin)} - {formatMoney(brief.budgetMax)}
                            </span>
                          ),
                        },
                        {
                          key: locale === 'ar' ? 'عدد الصناع المطلوبين' : 'Creator slots',
                          value: plural(
                            brief.slots || 1,
                            locale === 'ar' ? 'صانع' : 'creator',
                            locale === 'ar' ? 'صناع' : 'creators',
                            locale,
                          ),
                        },
                      ]}
                    />
                  </div>

                  {/* Talking points */}
                  {brief.talkingPoints && brief.talkingPoints.length > 0 && (
                    <div
                      style={{ borderTop: `1px dashed ${colors.border}`, paddingTop: spacing.md }}
                    >
                      <AppText
                        variant="dataMonoCaps"
                        color={colors.textSecondary}
                        style={{ marginBottom: spacing.sm, display: 'block' }}
                      >
                        {locale === 'ar' ? 'نقاط الحديث الأساسية' : 'Talking points'}
                      </AppText>
                      <ul
                        style={{
                          margin: 0,
                          paddingInlineStart: spacing.lg,
                          fontSize: 14,
                          color: colors.textPrimary,
                          lineHeight: 1.7,
                        }}
                      >
                        {brief.talkingPoints.map((tp, idx) => (
                          <li key={idx}>{tp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Do not say */}
                  {brief.doNotSay && brief.doNotSay.length > 0 && (
                    <div
                      style={{ borderTop: `1px dashed ${colors.border}`, paddingTop: spacing.md }}
                    >
                      <AppText
                        variant="dataMonoCaps"
                        color={colors.danger}
                        style={{ marginBottom: spacing.sm, display: 'block' }}
                      >
                        {locale === 'ar' ? 'محظورات وممنوعات (Do Not Say)' : 'Do not say'}
                      </AppText>
                      <ul
                        style={{
                          margin: 0,
                          paddingInlineStart: spacing.lg,
                          fontSize: 14,
                          color: colors.danger,
                          lineHeight: 1.7,
                        }}
                      >
                        {brief.doNotSay.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>

                {/* Right Column: Escrow Side Panel & Actions */}
                <div
                  className="ugcx-sticky-sidebar"
                  style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}
                >
                  {/* Escrow Card */}
                  <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
                    <div style={{ marginBottom: spacing.md }}>
                      <AppText
                        variant="subtitle"
                        style={{ fontWeight: 500, color: colors.textPrimary }}
                      >
                        {locale === 'ar' ? 'ضمان الحملة' : 'Campaign escrow'}
                      </AppText>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: spacing.md,
                          backgroundColor: colors.surfaceSoft,
                          borderRadius: radius.card,
                        }}
                      >
                        <div>
                          <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                            {locale === 'ar' ? 'المتاح للتخصيص' : 'Available'}
                          </AppText>
                          <div
                            style={{
                              fontSize: 22,
                              fontWeight: 500,
                              fontFamily: 'var(--font-mono, monospace)',
                              color: colors.primary,
                              marginTop: 2,
                              direction: 'ltr',
                              textAlign: 'start',
                            }}
                          >
                            {formatMoney(availableEscrow)}
                          </div>
                        </div>

                        <div style={{ textAlign: 'end' }}>
                          <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                            {locale === 'ar' ? 'المخصص' : 'Allocated'}
                          </AppText>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 500,
                              fontFamily: 'var(--font-mono, monospace)',
                              color: colors.textPrimary,
                              marginTop: 2,
                              direction: 'ltr',
                            }}
                          >
                            {formatMoney(allocatedEscrow)}
                          </div>
                        </div>
                      </div>

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

                  {/* Proposals & Hired KPI Cells */}
                  <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
                    <KpiCells
                      cells={[
                        {
                          label: locale === 'ar' ? 'عروض مقدمة' : 'Proposals',
                          value: String(totalProposalsCount),
                        },
                        {
                          label: locale === 'ar' ? 'مستنية ردك' : 'Waiting',
                          value: String(openProposalsCount),
                        },
                        {
                          label: locale === 'ar' ? 'تم التعاقد' : 'Hired',
                          value: `${hiredCount} / ${totalSlots}`,
                        },
                      ]}
                    />
                  </Card>

                  {/* Actions Bar. An empty card must never render. */}
                  {!isViewer &&
                    ((brief.status === 'draft' && can('fundEscrow')) ||
                      (brief.status === 'live' && can('createBrief')) ||
                      (brief.status === 'paused' && can('createBrief')) ||
                      (can('closeAndRefundBrief') &&
                        brief.status !== 'completed' &&
                        brief.status !== 'cancelled')) && (
                      <Card
                        elevation="card"
                        style={{
                          padding: spacing.md,
                          borderRadius: radius.card,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: spacing.sm,
                        }}
                      >
                        {brief.status === 'draft' && pendingManualPayment(brief) ? (
                          // Transfer submitted, admin checking it (UI audit G8).
                          <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => router.push(`/brand/briefs/${brief.id}/fund`)}
                          >
                            {locale === 'ar'
                              ? 'الدفع بيتراجع · التفاصيل'
                              : 'Payment being checked · details'}
                          </Button>
                        ) : brief.status === 'draft' && can('fundEscrow') ? (
                          <Button
                            variant="primary"
                            fullWidth
                            onClick={() => router.push(`/brand/briefs/${brief.id}/fund`)}
                          >
                            {locale === 'ar' ? 'تمويل رصيد الضمان' : 'Fund escrow'}
                          </Button>
                        ) : null}

                        {brief.status === 'live' && can('createBrief') && (
                          <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => pauseBrief.mutate(brief.id)}
                            loading={pauseBrief.isPending}
                          >
                            {locale === 'ar' ? 'إيقاف مؤقت للبريف' : 'Pause brief'}
                          </Button>
                        )}

                        {brief.status === 'paused' && can('createBrief') && (
                          <Button
                            variant="primary"
                            fullWidth
                            onClick={() => resumeBrief.mutate(brief.id)}
                            loading={resumeBrief.isPending}
                          >
                            {locale === 'ar' ? 'استئناف نشر البريف' : 'Resume brief'}
                          </Button>
                        )}

                        {can('closeAndRefundBrief') && (
                          <Button
                            variant="danger-outline"
                            fullWidth
                            onClick={() => setCloseModalOpen(true)}
                          >
                            {locale === 'ar' ? 'إغلاق واسترداد الضمان' : 'Close and refund'}
                          </Button>
                        )}
                      </Card>
                    )}
                </div>
              </div>

              {/* Close and Refund Modal */}
              <ModalSheet
                isOpen={closeModalOpen}
                onClose={() => setCloseModalOpen(false)}
                title={locale === 'ar' ? 'إغلاق البريف واسترداد المبلغ' : 'Close and refund brief'}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.md,
                    padding: spacing.md,
                  }}
                >
                  <AppText variant="bodySmall" color={colors.textPrimary}>
                    {locale === 'ar'
                      ? `عند إغلاق هذا البريف، سيتم رد المبلغ المتبقي غير المخصص (${formatMoney(availableEscrow)}) إلى حسابك البنكي أو رصيدك.`
                      : `Closing this brief will immediately return the remaining unallocated escrow balance (${formatMoney(availableEscrow)}) to your account.`}
                  </AppText>

                  <TextInput
                    label={
                      locale === 'ar' ? 'سبب الإغلاق (اختياري)' : 'Reason for closing (optional)'
                    }
                    value={closeReason}
                    onChangeText={setCloseReason}
                    placeholder={
                      locale === 'ar' ? 'اكتب سبب إغلاق البريف...' : 'Reason for cancellation...'
                    }
                    numberOfLines={2}
                  />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: spacing.sm,
                      marginTop: spacing.sm,
                    }}
                  >
                    <Button variant="secondary" onClick={() => setCloseModalOpen(false)}>
                      {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                      variant="danger-outline"
                      onClick={handleCloseBrief}
                      loading={closeBrief.isPending}
                    >
                      {locale === 'ar' ? 'تأكيد الإغلاق والاسترداد' : 'Confirm close and refund'}
                    </Button>
                  </div>
                </div>
              </ModalSheet>
            </div>
          );
        }}
      </QueryStateView>
    </AppShell>
  );
}
