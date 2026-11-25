'use client';

import React, { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { DeliverableType } from '@ugcx/shared-types';
import { AppShell } from '../../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  Checklist,
  Dropzone,
  HStepper,
  Icon,
  KeyValueList,
  QueryStateView,
  StatusBadge,
  Tag,
  TextInput,
  type HStep,
} from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import { useCollaboration } from '../../../../hooks/api/useCollaborations';
import {
  useCollaborationDeliverables,
  useRegisterDeliverable,
  useRequestDeliverableUploadUrl,
} from '../../../../hooks/api/useDeliverables';
import { useCampaign } from '../../../../hooks/api/useCampaigns';
import { uploadBrowserFileToPresignedUrl } from '../../../../hooks/api/useStorage';
import { extractErrorMessage } from '../../../../services/apiHelpers';
import { useTranslation } from '../../../../i18n';
import { formatDate, formatDateShort, formatDueDate, formatMoney } from '../../../../utils/format';
import { getCollabStage } from '../../../../utils/collabStage';
import { EMPTY_VALUE, languageLabel, videoTypeLabel } from '../../../../utils/labels';

export default function CreatorWorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: collaborationId } = use(params);
  const router = useRouter();
  const { t, locale } = useTranslation();

  const collabQuery = useCollaboration(collaborationId);
  const deliverablesQuery = useCollaborationDeliverables(collaborationId);
  const campaignQuery = useCampaign(collabQuery.data?.campaignId);

  const requestUploadUrl = useRequestDeliverableUploadUrl(collaborationId);
  const registerDeliverable = useRegisterDeliverable(collaborationId);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedPoints, setCheckedPoints] = useState<Record<number, boolean>>({});

  const collab = collabQuery.data;
  const campaign = campaignQuery.data;
  const deliverables = deliverablesQuery.data || [];
  const latestDeliverable = deliverables[deliverables.length - 1];

  const stageInfo = useMemo(() => {
    return getCollabStage(collab?.status || '', {
      isBrand: false,
      needsShipping: campaign?.needsShipping,
    });
  }, [collab?.status, campaign?.needsShipping]);

  // Stepper state
  const stepperSteps: HStep[] = useMemo(() => {
    const isShipped = !!collab?.shipmentConfirmedAt;
    const isReceived = !!(collab as any)?.receivedAt;
    const v1Done = deliverables.length >= 1;
    const isRevision = collab?.status === 'revision_requested';
    const isApproved = collab?.status === 'approved' || !!(collab as any)?.approvedAt;
    const isPaid = collab?.status === 'paid' || !!(collab as any)?.paidAt;

    const steps: HStep[] = [
      {
        label: locale === 'ar' ? 'تم القبول' : 'Accepted',
        state: 'done',
        date: formatDateShort(collab?.createdAt, locale),
      },
    ];

    if (campaign?.needsShipping) {
      steps.push({
        label: locale === 'ar' ? 'تم الشحن' : 'Shipped',
        state: isShipped ? 'done' : collab?.status === 'funded' ? 'current' : 'todo',
        date: collab?.shipmentConfirmedAt
          ? formatDateShort(collab.shipmentConfirmedAt, locale)
          : undefined,
      });
      steps.push({
        label: locale === 'ar' ? 'تم الاستلام' : 'Product received',
        state: isReceived ? 'done' : isShipped ? 'current' : 'todo',
        date: (collab as any)?.receivedAt
          ? formatDateShort((collab as any).receivedAt, locale)
          : undefined,
      });
    }

    const v1Pending = !v1Done;
    steps.push({
      label: v1Pending
        ? locale === 'ar'
          ? 'إرسال V1'
          : 'Submit V1'
        : locale === 'ar'
          ? 'تم إرسال V1'
          : 'V1 sent',
      state: v1Done
        ? 'done'
        : (!campaign?.needsShipping || isReceived) && !isRevision
          ? 'current'
          : 'todo',
      date: deliverables[0]?.createdAt
        ? formatDateShort(deliverables[0].createdAt, locale)
        : undefined,
    });

    if (collab?.status === 'revision_requested' || deliverables.length > 1) {
      steps.push({
        label: locale === 'ar' ? 'تعديل' : 'Revision',
        state: deliverables.length > 1 ? 'done' : 'current',
        date: deliverables[1]?.createdAt
          ? formatDateShort(deliverables[1].createdAt, locale)
          : undefined,
      });
    }

    steps.push({
      label: locale === 'ar' ? 'تم الاعتماد' : 'Approved',
      state: isApproved ? 'done' : 'todo',
      date: (collab as any)?.approvedAt
        ? formatDateShort((collab as any).approvedAt, locale)
        : undefined,
    });

    steps.push({
      label: locale === 'ar' ? 'تم الدفع' : 'Paid',
      state: isPaid ? 'done' : 'todo',
      date: (collab as any)?.paidAt ? formatDateShort((collab as any).paidAt, locale) : undefined,
    });

    return steps;
  }, [collab, campaign, deliverables, locale]);

  // Check if shipment is required and pending
  const isAwaitingShipment =
    campaign?.needsShipping && !collab?.shipmentConfirmedAt && collab?.status === 'funded';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError(
        locale === 'ar' ? 'يرجى اختيار ملف فيديو لرفعه.' : 'Please select a video file to upload.',
      );
      return;
    }

    try {
      setUploadProgress(10);
      const presigned = await requestUploadUrl.mutateAsync({
        contentType: selectedFile.type || 'video/mp4',
        fileSize: selectedFile.size,
      });

      await uploadBrowserFileToPresignedUrl(selectedFile, presigned.uploadUrl, setUploadProgress);

      await registerDeliverable.mutateAsync({
        type: 'ready_ad',
        fileUrl: presigned.fileUrl,
        durationSeconds: campaign?.durationSeconds || 30,
        note: note.trim() || undefined,
      });

      setSelectedFile(null);
      setNote('');
      setUploadProgress(null);
      deliverablesQuery.refetch();
      collabQuery.refetch();
    } catch (err) {
      setError(extractErrorMessage(err));
      setUploadProgress(null);
    }
  };

  return (
    <AppShell requiredRole="creator">
      <QueryStateView
        isLoading={collabQuery.isLoading || deliverablesQuery.isLoading}
        isError={collabQuery.isError || deliverablesQuery.isError}
        data={collabQuery.data}
        onRetry={() => {
          collabQuery.refetch();
          deliverablesQuery.refetch();
          campaignQuery.refetch();
        }}
      >
        {(collaboration) => {
          const brandName =
            (collaboration as any).brand?.companyName ||
            (locale === 'ar' ? 'العلامة التجارية' : 'Brand');
          const campaignTitle = campaign?.title || (locale === 'ar' ? 'التعاون' : 'Collaboration');
          const isRevision = collaboration.status === 'revision_requested';

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
                    onClick={() => router.push('/creator/work')}
                  >
                    ← {locale === 'ar' ? 'المهام' : 'Work'}
                  </Button>
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        flexWrap: 'wrap',
                      }}
                    >
                      <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
                        {campaignTitle}
                      </AppText>
                      <StatusBadge status={collaboration.status} domain="collaboration" />
                      {(collaboration as any).dueAt && (
                        <Tag tone="pend">
                          {locale === 'ar'
                            ? `استحقاق: ${formatDueDate((collaboration as any).dueAt, locale)}`
                            : `Due: ${formatDueDate((collaboration as any).dueAt, locale)}`}
                        </Tag>
                      )}
                      <Tag tone="accent">
                        {locale === 'ar'
                          ? `تعديل ${(collaboration as any).revisionsUsed ?? 0} من ${(collaboration as any).revisionLimit ?? 2}`
                          : `Revision ${(collaboration as any).revisionsUsed ?? 0} of ${(collaboration as any).revisionLimit ?? 2}`}
                      </Tag>
                    </div>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {brandName} ·{' '}
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          direction: 'ltr',
                          display: 'inline-block',
                        }}
                      >
                        {formatMoney(collaboration.creatorPrice)}
                      </span>{' '}
                      {locale === 'ar' ? 'في الضمان' : 'in escrow'}
                    </AppText>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/chats/${collaborationId}`)}
                >
                  <Icon name="chat" size={14} />
                  <span>{locale === 'ar' ? 'محادثة العلامة التجارية' : 'Chat with brand'}</span>
                </Button>
              </div>

              {/* Progress Stepper Card */}
              <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
                <HStepper steps={stepperSteps} />
              </Card>

              {/* 2-Column Job Sheet */}
              <div
                className="ugcx-split"
                style={
                  {
                    gap: spacing.xl,
                    ['--split-main' as string]: '1.2fr',
                    ['--split-side-min' as string]: '300px',
                  } as React.CSSProperties
                }
              >
                {/* Left Column: Feedback & Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                  {/* What to make. The creator needs the spec in every state,
                      and it keeps this column from rendering empty. */}
                  <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
                    <AppText
                      variant="dataMonoCaps"
                      color={colors.textSecondary}
                      style={{ display: 'block', marginBottom: spacing.sm }}
                    >
                      {locale === 'ar' ? 'ما المطلوب' : 'What to make'}
                    </AppText>
                    <KeyValueList
                      items={[
                        {
                          key: locale === 'ar' ? 'نوع الفيديو' : 'Video type',
                          value: videoTypeLabel(campaign?.videoType, locale),
                        },
                        {
                          key: locale === 'ar' ? 'المدة' : 'Duration',
                          value: campaign?.durationSeconds
                            ? `${campaign.durationSeconds}s`
                            : EMPTY_VALUE,
                        },
                        {
                          key: locale === 'ar' ? 'اللغة' : 'Language',
                          value: languageLabel(campaign?.language, locale),
                        },
                      ]}
                    />
                    {campaign?.brief ? (
                      <AppText
                        variant="bodySmall"
                        color={colors.textSecondary}
                        style={{ display: 'block', marginTop: spacing.md, lineHeight: 1.6 }}
                      >
                        {campaign.brief}
                      </AppText>
                    ) : null}
                  </Card>

                  {/* Brand Feedback Card (Shown on Revision) */}
                  {isRevision && latestDeliverable?.feedback && (
                    <Card
                      elevation="card"
                      style={{
                        padding: spacing.lg,
                        borderRadius: radius.card,
                        backgroundColor: '#fff5f5',
                        border: `1px solid ${colors.danger}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: spacing.sm,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                        <Icon name="alert-triangle" size={16} />
                        <AppText variant="dataMonoCaps" color={colors.danger}>
                          {locale === 'ar'
                            ? `ملاحظات العلامة التجارية · تعديل ${latestDeliverable.version || 1}`
                            : `Brand feedback · Revision ${latestDeliverable.version || 1}`}
                        </AppText>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          lineHeight: 1.5,
                          color: colors.textPrimary,
                          borderInlineStart: `3px solid ${colors.danger}`,
                          paddingInlineStart: spacing.md,
                        }}
                      >
                        {typeof latestDeliverable.feedback === 'string'
                          ? latestDeliverable.feedback
                          : Array.isArray(latestDeliverable.feedback)
                            ? (latestDeliverable.feedback as any[])
                                .map((f) => f.text || f.comment || JSON.stringify(f))
                                .join('\n')
                            : ''}
                      </p>
                    </Card>
                  )}

                  {/* Brand Approval Note Card */}
                  {collaboration.status === 'approved' && latestDeliverable && (
                    <Card
                      elevation="card"
                      style={{
                        padding: spacing.lg,
                        borderRadius: radius.card,
                        backgroundColor: '#f0fdf4',
                        border: `1px solid ${colors.primary}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: spacing.sm,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                        <Icon name="check" size={16} />
                        <AppText variant="dataMonoCaps" color={colors.primary}>
                          {locale === 'ar' ? 'تم اعتماد المخرج بنجاح' : 'Deliverable approved'}
                        </AppText>
                      </div>
                      {latestDeliverable.feedback && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: colors.textPrimary,
                          }}
                        >
                          {typeof latestDeliverable.feedback === 'string'
                            ? latestDeliverable.feedback
                            : Array.isArray(latestDeliverable.feedback)
                              ? (latestDeliverable.feedback as any[])
                                  .map((f) => f.body || f.text || f.comment || '')
                                  .filter(Boolean)
                                  .join('\n')
                              : ''}
                        </p>
                      )}
                    </Card>
                  )}

                  {/* Brief Talking Points Checklist */}
                  {campaign?.talkingPoints && campaign.talkingPoints.length > 0 && (
                    <Card
                      elevation="card"
                      style={{ padding: spacing.lg, borderRadius: radius.card }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: spacing.md,
                        }}
                      >
                        <AppText
                          variant="subtitle"
                          style={{ fontWeight: 500, color: colors.textPrimary }}
                        >
                          {locale === 'ar' ? 'قائمة نقاط البريف' : 'Brief checklist'}
                        </AppText>
                        <AppText variant="caption" color={colors.textTertiary}>
                          {locale === 'ar'
                            ? 'تأكد من شمولها في الفيديو'
                            : 'Review before submitting'}
                        </AppText>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                        {campaign.talkingPoints.map((point, idx) => {
                          const isDone = !!checkedPoints[idx];
                          return (
                            <div
                              key={idx}
                              onClick={() =>
                                setCheckedPoints((prev) => ({ ...prev, [idx]: !prev[idx] }))
                              }
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing.sm,
                                padding: spacing.sm,
                                borderRadius: radius.chip,
                                cursor: 'pointer',
                                backgroundColor: isDone ? colors.accentSoft : colors.canvas,
                              }}
                            >
                              <div
                                style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: radius.badge,
                                  border: `1.5px solid ${isDone ? colors.primary : colors.border}`,
                                  backgroundColor: isDone ? colors.primary : colors.surface,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: colors.surface,
                                }}
                              >
                                {isDone && <Icon name="check" size={12} />}
                              </div>
                              <span
                                style={{
                                  fontSize: 13,
                                  color: colors.textPrimary,
                                  textDecoration: isDone ? 'line-through' : 'none',
                                }}
                              >
                                {point}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}
                </div>

                {/* Right Column: Upload & Escrow Rules */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                  {/* Upload Card */}
                  <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
                    <div style={{ marginBottom: spacing.md }}>
                      <AppText
                        variant="subtitle"
                        style={{ fontWeight: 500, color: colors.textPrimary }}
                      >
                        {isRevision
                          ? locale === 'ar'
                            ? `رفع النسخة المعدلة (V${(latestDeliverable?.version || 1) + 1})`
                            : `Upload revision V${(latestDeliverable?.version || 1) + 1}`
                          : locale === 'ar'
                            ? 'تسليم الفيديو'
                            : 'Upload deliverable'}
                      </AppText>
                    </div>

                    {isAwaitingShipment ? (
                      <div
                        style={{
                          padding: spacing.lg,
                          borderRadius: radius.card,
                          backgroundColor: colors.surfaceSoft,
                          textAlign: 'center',
                        }}
                      >
                        <AppText variant="bodySmall" color={colors.textSecondary}>
                          {locale === 'ar'
                            ? 'في انتظار شحن المنتج من العلامة التجارية. ستتمكن من رفع الفيديو بمجرد تأكيد الشحن.'
                            : 'Waiting for brand to ship the product. Video upload unlocks once shipment is confirmed.'}
                        </AppText>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleSubmit}
                        style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
                      >
                        {error && (
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
                            {error}
                          </div>
                        )}

                        <Dropzone
                          accept="video/mp4,video/quicktime,video/webm"
                          maxSizeMB={500}
                          file={selectedFile}
                          onFileSelect={setSelectedFile}
                          progress={uploadProgress ?? undefined}
                        />

                        <TextInput
                          label={
                            locale === 'ar'
                              ? 'ملاحظات للعلامة التجارية (اختياري)'
                              : 'Notes for brand (optional)'
                          }
                          placeholder={
                            locale === 'ar'
                              ? 'وضح أي تفاصيل أو تغييرات قمت بها في هذا التسليم...'
                              : 'Explain what you created or changed in this version...'
                          }
                          value={note}
                          onChangeText={setNote}
                          numberOfLines={3}
                        />

                        <Button
                          type="submit"
                          variant="primary"
                          fullWidth
                          loading={requestUploadUrl.isPending || registerDeliverable.isPending}
                          disabled={!selectedFile}
                        >
                          {locale === 'ar' ? 'إرسال المخرج' : 'Submit deliverable'}
                        </Button>
                      </form>
                    )}
                  </Card>

                  {/* Escrow Rule Card */}
                  <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
                    <KeyValueList
                      items={[
                        {
                          key: locale === 'ar' ? 'في الضمان' : 'In escrow',
                          value: (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono, monospace)',
                                fontWeight: 500,
                                direction: 'ltr',
                                display: 'inline-block',
                              }}
                            >
                              {formatMoney(collaboration.creatorPrice)}
                            </span>
                          ),
                        },
                        {
                          key: locale === 'ar' ? 'شروط الدفع' : 'Payment rule',
                          value:
                            locale === 'ar'
                              ? 'يتم التحويل فور اعتماد العلامة التجارية'
                              : 'Released when brand approves',
                        },
                      ]}
                    />
                  </Card>
                </div>
              </div>
            </div>
          );
        }}
      </QueryStateView>
    </AppShell>
  );
}
