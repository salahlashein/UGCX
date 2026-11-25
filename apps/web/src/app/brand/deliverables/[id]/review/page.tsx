'use client';

import React, { Suspense, use, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '../../../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  Checklist,
  FilterChip,
  Icon,
  LoadingState,
  ModalSheet,
  QueryStateView,
  SegmentedControl,
  StatusBadge,
  Tag,
  TextInput,
  VideoPlayer,
} from '../../../../../components/ui';
import { colors, radius, spacing } from '../../../../../theme/tokens';
import {
  useDeliverablePlayUrl,
  useReviewDeliverable,
  useCollaborationDeliverables,
} from '../../../../../hooks/api/useDeliverables';
import { useCollaboration } from '../../../../../hooks/api/useCollaborations';
import { useCampaign } from '../../../../../hooks/api/useCampaigns';
import { useBrandRole } from '../../../../../hooks/useBrandRole';
import { extractErrorMessage } from '../../../../../services/apiHelpers';
import { useTranslation } from '../../../../../i18n';
import { formatMoney } from '../../../../../utils/format';
import { EMPTY_VALUE } from '../../../../../utils/labels';

const REASON_CHIPS = [
  'Audio',
  'Lighting',
  'Missing talking point',
  'Wrong length',
  'Branding',
  'Captions',
];

export default function DeliverableReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: deliverableId } = use(params);
  return (
    <AppShell requiredRole="brand">
      <Suspense fallback={<LoadingState />}>
        <DeliverableReviewContent deliverableId={deliverableId} />
      </Suspense>
    </AppShell>
  );
}

function DeliverableReviewContent({ deliverableId }: { deliverableId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collaborationIdFromQuery = searchParams.get('collaborationId') ?? undefined;
  const { t, locale } = useTranslation();
  const { can, role: memberRole } = useBrandRole();

  const isViewer = memberRole === 'viewer';

  const [activeDeliverableId, setActiveDeliverableId] = useState(deliverableId);

  // A direct link carries no query parameter. The play URL response names the
  // parent collaboration, so the screen still has its context.
  const playUrlQuery = useDeliverablePlayUrl(activeDeliverableId);
  const collaborationId = collaborationIdFromQuery ?? playUrlQuery.data?.collaborationId;

  const collabQuery = useCollaboration(collaborationId);
  const campaignQuery = useCampaign(collabQuery.data?.campaignId);
  const deliverablesQuery = useCollaborationDeliverables(collaborationId);

  const reviewMutation = useReviewDeliverable(collaborationId);

  const [showRevisionSection, setShowRevisionSection] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const [approvedSuccess, setApprovedSuccess] = useState(false);
  // Approving releases escrow to the creator, so it takes a second click.
  const [confirmingApprove, setConfirmingApprove] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const deliverables = deliverablesQuery.data || [];
  const activeDeliverable =
    deliverables.find((d) => d.id === activeDeliverableId) || deliverables[0];

  const versionNumber = activeDeliverable?.version || 1;

  // Count revision requests
  const revisionsCount = useMemo(() => {
    // Only versions the brand sent back count; an empty feedback list is
    // truthy in JS and an approval note is not a revision.
    return deliverables.filter((d) => (d.status as string) === 'revision_requested').length;
  }, [deliverables]);

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason],
    );
  };

  const handleApprove = async () => {
    setActionError(null);
    try {
      await reviewMutation.mutateAsync({
        id: activeDeliverableId,
        dto: {
          action: 'approve',
          feedback: approveNote.trim() || undefined,
        },
      });
      setApprovedSuccess(true);
      setConfirmingApprove(false);
      deliverablesQuery.refetch();
      collabQuery.refetch();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  };

  const handleRequestRevision = async () => {
    setActionError(null);
    const combinedFeedback = [
      selectedReasons.length > 0 ? `[${selectedReasons.join(', ')}]` : '',
      revisionFeedback.trim(),
    ]
      .filter(Boolean)
      .join(' ');

    if (!combinedFeedback) {
      setActionError(
        locale === 'ar'
          ? 'يرجى تقديم ملاحظات التعديل لصانع المحتوى.'
          : 'Please provide feedback for the creator.',
      );
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: activeDeliverableId,
        dto: {
          action: 'request_revision',
          feedback: combinedFeedback,
        },
      });
      if (collaborationId) {
        router.push(`/brand/collaborations/${collaborationId}`);
      }
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  };

  const handleDecline = async () => {
    setActionError(null);
    try {
      await reviewMutation.mutateAsync({
        id: activeDeliverableId,
        dto: {
          action: 'decline',
          feedback: declineReason.trim() || undefined,
        },
      });
      setShowDeclineModal(false);
      if (collaborationId) {
        router.push(`/brand/collaborations/${collaborationId}`);
      }
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  };

  const collab = collabQuery.data;
  const creatorName = (collab as any)?.creator?.displayName ?? null;
  const campaign = campaignQuery.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      {/* Top Header */}
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
            onClick={() => {
              if (collaborationId) {
                router.push(`/brand/collaborations/${collaborationId}`);
              } else {
                router.back();
              }
            }}
          >
            {locale === 'ar' ? '→ التعاون' : '← Collaboration'}
          </Button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}
            >
              <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
                {campaign?.title || (locale === 'ar' ? 'مراجعة المخرج' : 'Review deliverable')}
              </AppText>
              <Tag tone="live">{`Version ${versionNumber}`}</Tag>
            </div>
            <AppText variant="caption" color={colors.textSecondary}>
              {creatorName
                ? `${locale === 'ar' ? 'صانع المحتوى:' : 'Creator:'} ${creatorName}`
                : collabQuery.isLoading
                  ? locale === 'ar'
                    ? 'جارٍ تحميل تفاصيل التعاون'
                    : 'Loading collaboration details'
                  : locale === 'ar'
                    ? 'صانع المحتوى'
                    : 'Creator'}
            </AppText>
          </div>
        </div>
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

      {/* 2-Column Review Player & Decision Layout */}
      <div
        className="ugcx-split"
        style={
          {
            gap: spacing.xl,
            ['--split-main' as string]: '1.4fr',
            ['--split-side-min' as string]: '320px',
          } as React.CSSProperties
        }
      >
        {/* Left Column: Player & Version Switcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <Card
            elevation="card"
            style={{ padding: spacing.md, borderRadius: radius.card, backgroundColor: '#000000' }}
          >
            <div style={{ direction: 'ltr' }}>
              <VideoPlayer
                src={playUrlQuery.data?.url || (playUrlQuery.data as any)?.playUrl || ''}
                poster={(activeDeliverable as any)?.thumbnailUrl}
                autoPlay={false}
              />
            </div>
          </Card>

          {/* Version Switcher */}
          {deliverables.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SegmentedControl
                options={deliverables.map((d, idx) => ({
                  label: `V${d.version || idx + 1}`,
                  value: d.id,
                }))}
                value={activeDeliverableId}
                onChange={setActiveDeliverableId}
              />
            </div>
          )}

          {/* The creator's note on this version (UI audit brand-review/C1). */}
          {activeDeliverable?.note ? (
            <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
              <AppText
                variant="dataMonoCaps"
                color={colors.textSecondary}
                style={{ display: 'block', marginBottom: spacing.xs }}
              >
                {locale === 'ar'
                  ? `ملاحظة الكريتور على V${activeDeliverable.version || 1}`
                  : `Creator's note on V${activeDeliverable.version || 1}`}
              </AppText>
              <AppText
                variant="bodySmall"
                color={colors.textPrimary}
                style={{ display: 'block', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
              >
                {activeDeliverable.note}
              </AppText>
            </Card>
          ) : null}
        </div>

        {/* Right Column: Brief Checklist & Decision Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {/* Brief Checklist Aid */}
          {campaign?.talkingPoints && campaign.talkingPoints.length > 0 && (
            <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
              <div style={{ marginBottom: spacing.sm }}>
                <AppText variant="subtitle" style={{ fontWeight: 500, color: colors.textPrimary }}>
                  {locale === 'ar' ? 'قائمة نقاط البريف المطلوبة' : 'Brief checklist'}
                </AppText>
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingInlineStart: spacing.lg,
                  fontSize: 13,
                  color: colors.textPrimary,
                  lineHeight: 1.6,
                }}
              >
                {campaign.talkingPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Decision Card */}
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
            {(() => {
              const revisionsUsed = (collab as any)?.revisionsUsed ?? revisionsCount;
              const revisionLimit =
                (collab as any)?.revisionLimit ?? (campaign as any)?.revisionLimit ?? 2;
              const isLimitReached = revisionsUsed >= revisionLimit;

              return (
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <AppText
                      variant="subtitle"
                      style={{ fontWeight: 500, color: colors.textPrimary }}
                    >
                      {locale === 'ar' ? 'قرار اعتماد المخرج' : 'Review decision'}
                    </AppText>
                    <AppText
                      variant="caption"
                      color={colors.textSecondary}
                      style={{ display: 'block', marginTop: 2 }}
                    >
                      {locale === 'ar' ? 'التعديلات المستخدمة' : 'Revisions used'}
                    </AppText>
                  </div>
                  <Tag tone={isLimitReached ? 'danger' : 'accent'}>
                    {locale === 'ar'
                      ? `${revisionsUsed} / ${revisionLimit}`
                      : `${revisionsUsed} of ${revisionLimit}`}
                  </Tag>
                </div>
              );
            })()}

            {/* Escrow Release Row */}
            <div
              style={{
                padding: spacing.md,
                backgroundColor: colors.surfaceSoft,
                borderRadius: radius.card,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.xs,
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                  {locale === 'ar' ? 'المبلغ المحرر للصانع' : 'Release upon approval'}
                </AppText>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 500,
                    fontSize: 16,
                    color: colors.primary,
                    direction: 'ltr',
                  }}
                >
                  {collab?.creatorPrice ? formatMoney(collab.creatorPrice) : EMPTY_VALUE}
                </span>
              </div>
              <AppText variant="caption" color={colors.textTertiary}>
                {locale === 'ar'
                  ? 'لا توجد رسوم جديدة. يتم الإفراج من رصيد ضمان الحملة.'
                  : 'No new charge. Released from campaign escrow.'}
              </AppText>
            </div>

            {approvedSuccess ? (
              <div
                style={{
                  padding: spacing.md,
                  backgroundColor: colors.accentSoft,
                  borderRadius: radius.card,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  color: colors.primary,
                }}
              >
                <Icon name="check" size={20} />
                <span style={{ fontWeight: 500, fontSize: 14 }}>
                  {locale === 'ar'
                    ? 'تم اعتماد المخرج والإفراج عن رصيد الضمان بنجاح.'
                    : 'Deliverable approved. Escrow released.'}
                </span>
              </div>
            ) : isViewer ? (
              <div
                style={{
                  padding: spacing.md,
                  backgroundColor: colors.canvas,
                  borderRadius: radius.card,
                  textAlign: 'center',
                }}
              >
                <AppText variant="bodySmall" color={colors.textSecondary}>
                  {locale === 'ar'
                    ? 'صلاحياتك للعرض فقط ولا يمكنك اتخاذ قرار الاعتماد.'
                    : 'Viewer role has read-only access to deliverable review.'}
                </AppText>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                {/* Approval Note (Optional) */}
                <TextInput
                  label={locale === 'ar' ? 'ملاحظة اعتماد (اختياري)' : 'Approval note (optional)'}
                  placeholder={
                    locale === 'ar'
                      ? 'أضف رسالة تقدير أو ملاحظة لصانع المحتوى...'
                      : 'Add praise or a note for the creator...'
                  }
                  value={approveNote}
                  onChangeText={setApproveNote}
                  numberOfLines={2}
                />

                {/* Approve Button: the first click asks, the second releases escrow */}
                {confirmingApprove ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing.sm,
                      padding: spacing.md,
                      borderRadius: radius.card,
                      border: `1px solid ${colors.hairline}`,
                    }}
                  >
                    <AppText variant="bodySmall" color={colors.textPrimary}>
                      {locale === 'ar'
                        ? `هيتحوّل ${collab?.creatorPrice ? formatMoney(collab.creatorPrice) : ''} للكريتور ومينفعش ترجع فيه. متأكد؟`
                        : `This releases ${collab?.creatorPrice ? formatMoney(collab.creatorPrice) : 'the escrow'} to the creator and can't be undone. Approve?`}
                    </AppText>
                    <div style={{ display: 'flex', gap: spacing.sm }}>
                      <Button
                        variant="primary"
                        onClick={handleApprove}
                        loading={reviewMutation.isPending}
                      >
                        <Icon name="check" size={16} />
                        <span>{locale === 'ar' ? 'أيوه، اعتمد' : 'Yes, approve'}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setConfirmingApprove(false)}
                        disabled={reviewMutation.isPending}
                      >
                        {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="primary" fullWidth onClick={() => setConfirmingApprove(true)}>
                    <Icon name="check" size={16} />
                    <span>
                      {locale === 'ar' ? 'اعتماد وإفراج عن الضمان' : 'Approve deliverable'}
                    </span>
                  </Button>
                )}

                {/* Request Revision Toggle */}
                {!showRevisionSection ? (
                  <div style={{ display: 'flex', gap: spacing.sm }}>
                    {(() => {
                      const revisionsUsed = (collab as any)?.revisionsUsed ?? revisionsCount;
                      const revisionLimit =
                        (collab as any)?.revisionLimit ?? (campaign as any)?.revisionLimit ?? 2;
                      const isLimitReached = revisionsUsed >= revisionLimit;

                      return (
                        <Button
                          variant="secondary"
                          fullWidth
                          disabled={isLimitReached}
                          onClick={() => setShowRevisionSection(true)}
                        >
                          {isLimitReached
                            ? locale === 'ar'
                              ? 'استنفد الحد الأقصى للتعديلات'
                              : 'Revision limit reached'
                            : locale === 'ar'
                              ? 'طلب تعديل'
                              : 'Request revision'}
                        </Button>
                      );
                    })()}

                    <Button variant="danger-outline" onClick={() => setShowDeclineModal(true)}>
                      {locale === 'ar' ? 'رفض' : 'Decline'}
                    </Button>
                  </div>
                ) : (
                  <div
                    style={{
                      borderTop: `1px dashed ${colors.border}`,
                      paddingTop: spacing.md,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing.sm,
                    }}
                  >
                    <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                      {locale === 'ar' ? 'أسباب طلب التعديل' : 'Revision reasons'}
                    </AppText>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                      {REASON_CHIPS.map((chip) => (
                        <FilterChip
                          key={chip}
                          label={chip}
                          selected={selectedReasons.includes(chip)}
                          onClick={() => toggleReason(chip)}
                        />
                      ))}
                    </div>

                    <TextInput
                      label={locale === 'ar' ? 'الملاحظات المطلوبة للتعديل' : 'Revision feedback'}
                      placeholder={
                        locale === 'ar'
                          ? 'وضح التغييرات المطلوبة بالتفصيل...'
                          : 'Describe exactly what changes are required...'
                      }
                      value={revisionFeedback}
                      onChangeText={setRevisionFeedback}
                      numberOfLines={3}
                    />

                    <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.xs }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowRevisionSection(false)}
                      >
                        {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleRequestRevision}
                        loading={reviewMutation.isPending}
                      >
                        {locale === 'ar' ? 'إرسال طلب التعديل' : 'Submit revision request'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Decline Confirmation Modal */}
      <ModalSheet
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        title={locale === 'ar' ? 'تأكيد رفض المخرج' : 'Decline deliverable'}
      >
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, padding: spacing.md }}
        >
          <AppText variant="bodySmall" color={colors.textPrimary}>
            {locale === 'ar'
              ? 'هل أنت متأكد من رغبتك في رفض هذا المخرج؟'
              : 'Are you sure you want to decline this deliverable?'}
          </AppText>

          <TextInput
            label={locale === 'ar' ? 'سبب الرفض' : 'Reason for decline'}
            value={declineReason}
            onChangeText={setDeclineReason}
            placeholder="Explain why this deliverable is declined..."
            numberOfLines={2}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.sm }}>
            <Button variant="secondary" onClick={() => setShowDeclineModal(false)}>
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="danger-outline"
              onClick={handleDecline}
              loading={reviewMutation.isPending}
            >
              {locale === 'ar' ? 'تأكيد الرفض' : 'Confirm decline'}
            </Button>
          </div>
        </div>
      </ModalSheet>
    </div>
  );
}
