'use client';

import React, { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  Icon,
  KeyValueList,
  KpiCells,
  QueryStateView,
  StatusBadge,
  Tag,
  TextInput,
  VerticalTimeline,
  type TimelineStep,
} from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import { useCollaboration, useConfirmShipment } from '../../../../hooks/api/useCollaborations';
import { useCollaborationDeliverables } from '../../../../hooks/api/useDeliverables';
import { useCreatorProfilePreview } from '../../../../hooks/api/useProposals';
import { useCampaign } from '../../../../hooks/api/useCampaigns';
import { useBrandRole } from '../../../../hooks/useBrandRole';
import { extractErrorMessage } from '../../../../services/apiHelpers';
import { useTranslation } from '../../../../i18n';
import { formatDateShort, formatMoney } from '../../../../utils/format';
import { getCollabStage } from '../../../../utils/collabStage';

export default function BrandCollaborationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: collaborationId } = use(params);
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { can, role: memberRole } = useBrandRole();

  const collabQuery = useCollaboration(collaborationId);
  const deliverablesQuery = useCollaborationDeliverables(collaborationId);
  const confirmShipment = useConfirmShipment();

  const collab = collabQuery.data;
  const campaignQuery = useCampaign(collab?.campaignId);
  const campaign = campaignQuery.data;

  const previewQuery = useCreatorProfilePreview(collab?.proposalId);
  const creatorPreview = previewQuery.data;

  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipmentError, setShipmentError] = useState<string | null>(null);

  const isViewer = memberRole === 'viewer';
  const deliverables = deliverablesQuery.data || [];
  const latestDeliverable = deliverables[deliverables.length - 1];

  const revisionsCount = useMemo(() => {
    return deliverables.filter((d) => (d.status as string) === 'revision_requested' || !!d.feedback)
      .length;
  }, [deliverables]);

  // Build vertical timeline steps
  const timelineSteps: TimelineStep[] = useMemo(() => {
    if (!collab) return [];

    const isShipped = !!collab.shipmentConfirmedAt || !campaign?.needsShipping;
    const isApproved = collab.status === 'approved' || collab.status === 'paid';
    const isPaid = collab.status === 'paid';

    const steps: TimelineStep[] = [
      {
        id: 'accepted',
        title: locale === 'ar' ? 'قبول العرض وبدء التعاون' : 'Proposal accepted',
        state: 'done',
        date: formatDateShort(collab.createdAt, locale),
        description: `${formatMoney(collab.creatorPrice)} ${locale === 'ar' ? 'محجوزة في الضمان' : 'held in escrow'}`,
      },
    ];

    if (campaign?.needsShipping) {
      steps.push({
        id: 'shipped',
        title: locale === 'ar' ? 'شحن المنتج' : 'Product shipped',
        state: collab.shipmentConfirmedAt
          ? 'done'
          : collab.status === 'funded'
            ? 'current'
            : 'todo',
        date: collab.shipmentConfirmedAt
          ? formatDateShort(collab.shipmentConfirmedAt, locale)
          : undefined,
        description: collab.shipmentTrackingNumber
          ? `${collab.shipmentCarrier || 'Carrier'}: ${collab.shipmentTrackingNumber}`
          : locale === 'ar'
            ? 'بانتظار تأكيد الشحن ورقم التتبع'
            : 'Waiting for shipment details',
      });

      steps.push({
        id: 'received',
        title: locale === 'ar' ? 'استلام الصانع للمنتج' : 'Product received by creator',
        state: (collab as any).receivedAt
          ? 'done'
          : collab.shipmentConfirmedAt
            ? 'current'
            : 'todo',
        date: (collab as any).receivedAt
          ? formatDateShort((collab as any).receivedAt, locale)
          : undefined,
        description: (collab as any).receivedAt
          ? locale === 'ar'
            ? 'أكد الصانع استلام المنتج'
            : 'Creator confirmed receipt'
          : locale === 'ar'
            ? 'بانتظار استلام الشحنة'
            : 'Awaiting delivery receipt',
      });
    }

    deliverables.forEach((d, idx) => {
      const vNum = d.version || idx + 1;
      const isDelivDelivered =
        (d.status as string) === 'submitted' || (d.status as string) === 'approved';
      steps.push({
        id: `deliverable-${d.id}`,
        title: `${locale === 'ar' ? 'تسليم النسخة' : 'Version'} ${vNum}`,
        state: isDelivDelivered || isApproved ? 'done' : 'current',
        date: formatDateShort(d.createdAt, locale),
        description: `${d.durationSeconds || 30}s ${locale === 'ar' ? 'فيديو' : 'video deliverable'}`,
      });

      if (d.feedback) {
        steps.push({
          id: `revision-${d.id}`,
          title: locale === 'ar' ? `طلب تعديل النسخة ${vNum}` : `Revision requested for V${vNum}`,
          state: 'done',
          description:
            typeof d.feedback === 'string'
              ? d.feedback
              : Array.isArray(d.feedback)
                ? (d.feedback as any[])
                    .map((f) => f.text || f.comment || JSON.stringify(f))
                    .join('; ')
                : '',
        });
      }
    });

    steps.push({
      id: 'approved',
      title: locale === 'ar' ? 'اعتماد المخرج والإفراج عن الضمان' : 'Deliverable approved',
      state: isApproved ? 'done' : 'todo',
      date: (collab as any).approvedAt
        ? formatDateShort((collab as any).approvedAt, locale)
        : undefined,
      description: isApproved
        ? locale === 'ar'
          ? 'تم تحرير المبلغ'
          : 'Escrow released'
        : undefined,
    });

    steps.push({
      id: 'paid',
      title: locale === 'ar' ? 'اكتمال الدفع للصانع' : 'Paid to creator',
      state: isPaid ? 'done' : 'todo',
      date: (collab as any).paidAt ? formatDateShort((collab as any).paidAt, locale) : undefined,
    });

    return steps;
  }, [collab, campaign, deliverables, locale]);

  const handleConfirmShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setShipmentError(null);
    if (!carrier.trim() || !trackingNumber.trim()) {
      setShipmentError(
        locale === 'ar'
          ? 'أدخل اسم شركة الشحن ورقم التتبع.'
          : 'Enter both carrier and tracking number.',
      );
      return;
    }
    try {
      await confirmShipment.mutateAsync({
        id: collaborationId,
        dto: {
          carrier: carrier.trim(),
          trackingNumber: trackingNumber.trim(),
        },
      });
      setCarrier('');
      setTrackingNumber('');
      collabQuery.refetch();
    } catch (err) {
      setShipmentError(extractErrorMessage(err));
    }
  };

  return (
    <AppShell requiredRole="brand">
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
          const creatorName =
            creatorPreview?.displayName || (locale === 'ar' ? 'صانع المحتوى' : 'Creator');
          const campaignTitle = campaign?.title || (locale === 'ar' ? 'البريف' : 'Brief');

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
                    onClick={() => {
                      if (collaboration.campaignId) {
                        router.push(`/brand/briefs/${collaboration.campaignId}`);
                      } else {
                        router.push('/brand/briefs');
                      }
                    }}
                  >
                    ← {locale === 'ar' ? 'البريف' : 'Brief'}
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
                        {creatorName}
                      </AppText>
                      <StatusBadge status={collaboration.status} domain="collaboration" />
                      <Tag tone="accent">
                        {locale === 'ar'
                          ? `تعديل ${(collaboration as any).revisionsUsed ?? 0} من ${(collaboration as any).revisionLimit ?? 2}`
                          : `Revision ${(collaboration as any).revisionsUsed ?? 0} of ${(collaboration as any).revisionLimit ?? 2}`}
                      </Tag>
                    </div>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {campaignTitle} ·{' '}
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          direction: 'ltr',
                          display: 'inline-block',
                        }}
                      >
                        {formatMoney(collaboration.creatorPrice)}
                      </span>{' '}
                      {locale === 'ar' ? 'في الضمان' : 'held in escrow'}
                    </AppText>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: spacing.sm }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/chats/${collaborationId}`)}
                  >
                    <Icon name="chat" size={14} />
                    <span>{locale === 'ar' ? 'محادثة الصانع' : 'Chat'}</span>
                  </Button>

                  {latestDeliverable && can('acceptProposal') && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/brand/deliverables/${latestDeliverable.id}/review?collaborationId=${collaborationId}`,
                        )
                      }
                    >
                      <Icon name="video" size={14} />
                      <span>{locale === 'ar' ? 'مراجعة المخرج' : 'Review deliverable'}</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* 2-Column Main Workspace */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)',
                  gap: spacing.xl,
                  alignItems: 'start',
                }}
              >
                {/* Left Column: Vertical Timeline & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                  <Card elevation="card" style={{ padding: spacing.xl, borderRadius: radius.card }}>
                    <div style={{ marginBottom: spacing.lg }}>
                      <AppText
                        variant="subtitle"
                        style={{ fontWeight: 500, color: colors.textPrimary }}
                      >
                        {locale === 'ar' ? 'جدول تقدم التعاون' : 'Collaboration timeline'}
                      </AppText>
                    </div>

                    <VerticalTimeline steps={timelineSteps} />
                  </Card>

                  {/* Shipment Confirmation Form when pending shipment */}
                  {campaign?.needsShipping &&
                    !collaboration.shipmentConfirmedAt &&
                    !isViewer &&
                    can('acceptProposal') && (
                      <Card
                        elevation="card"
                        style={{ padding: spacing.lg, borderRadius: radius.card }}
                      >
                        <div style={{ marginBottom: spacing.md }}>
                          <AppText
                            variant="subtitle"
                            style={{ fontWeight: 500, color: colors.textPrimary }}
                          >
                            {locale === 'ar'
                              ? 'تأكيد شحن المنتج للصانع'
                              : 'Confirm product shipment'}
                          </AppText>
                          <AppText
                            variant="caption"
                            color={colors.textSecondary}
                            style={{ display: 'block', marginTop: 2 }}
                          >
                            {locale === 'ar'
                              ? 'أدخل تفاصيل الشحن لتمكين صانع المحتوى من استلام المنتج وتصوير الفيديو'
                              : 'Provide tracking details so the creator can receive sample and film.'}
                          </AppText>
                        </div>

                        <form
                          onSubmit={handleConfirmShipment}
                          style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
                        >
                          {shipmentError && (
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
                              {shipmentError}
                            </div>
                          )}

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: spacing.md,
                            }}
                          >
                            <TextInput
                              label={locale === 'ar' ? 'شركة الشحن' : 'Carrier'}
                              placeholder="e.g. Bosta, Aramex"
                              value={carrier}
                              onChangeText={setCarrier}
                            />
                            <TextInput
                              label={locale === 'ar' ? 'رقم التتبع' : 'Tracking number'}
                              placeholder="Tracking #"
                              value={trackingNumber}
                              onChangeText={setTrackingNumber}
                              mono
                              dir="ltr"
                            />
                          </div>

                          <Button
                            type="submit"
                            variant="primary"
                            loading={confirmShipment.isPending}
                          >
                            {locale === 'ar' ? 'تأكيد إرسال الشحنة' : 'Confirm shipment'}
                          </Button>
                        </form>
                      </Card>
                    )}
                </div>

                {/* Right Column: Escrow, Shipment, Creator Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                  {/* Escrow Card */}
                  <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
                    <KeyValueList
                      items={[
                        {
                          key: locale === 'ar' ? 'قيمة التعاون في الضمان' : 'In escrow',
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
                          key: locale === 'ar' ? 'تعديلات مستخدمة' : 'Revisions used',
                          value: `${revisionsCount}`,
                        },
                      ]}
                    />
                  </Card>

                  {/* Shipment Details Card */}
                  {campaign?.needsShipping && collaboration.shipmentConfirmedAt && (
                    <Card
                      elevation="card"
                      style={{ padding: spacing.lg, borderRadius: radius.card }}
                    >
                      <div style={{ marginBottom: spacing.sm }}>
                        <AppText
                          variant="subtitle"
                          style={{ fontWeight: 500, color: colors.textPrimary }}
                        >
                          {locale === 'ar' ? 'بيانات الشحنة' : 'Shipment details'}
                        </AppText>
                      </div>
                      <KeyValueList
                        items={[
                          {
                            key: locale === 'ar' ? 'شركة الشحن' : 'Carrier',
                            value: collaboration.shipmentCarrier || 'Standard',
                          },
                          {
                            key: locale === 'ar' ? 'رقم التتبع' : 'Tracking #',
                            value: (
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono, monospace)',
                                  direction: 'ltr',
                                  display: 'inline-block',
                                }}
                              >
                                {collaboration.shipmentTrackingNumber}
                              </span>
                            ),
                          },
                          {
                            key: locale === 'ar' ? 'تاريخ الشحن' : 'Shipped on',
                            value: formatDateShort(collaboration.shipmentConfirmedAt, locale),
                          },
                        ]}
                      />
                    </Card>
                  )}

                  {/* Creator Stats Card */}
                  {creatorPreview && (
                    <Card
                      elevation="card"
                      style={{ padding: spacing.lg, borderRadius: radius.card }}
                    >
                      <div style={{ marginBottom: spacing.sm }}>
                        <AppText
                          variant="subtitle"
                          style={{ fontWeight: 500, color: colors.textPrimary }}
                        >
                          {locale === 'ar' ? 'إحصائيات الصانع' : 'Creator statistics'}
                        </AppText>
                      </div>
                      <KpiCells
                        cells={[
                          {
                            label: locale === 'ar' ? 'أعمال منجزة' : 'Jobs',
                            value: String(
                              creatorPreview.jobsDone ??
                                (creatorPreview as any).jobsCompletedCount ??
                                0,
                            ),
                          },
                          {
                            label: locale === 'ar' ? 'المدينة' : 'City',
                            value: creatorPreview.city || 'Cairo',
                          },
                          {
                            label: locale === 'ar' ? 'السعر المعتاد' : 'Base rate',
                            value: formatMoney(
                              creatorPreview.proposal?.price ?? (creatorPreview as any).basePrice,
                            ),
                          },
                        ]}
                      />
                    </Card>
                  )}
                </div>
              </div>
            </div>
          );
        }}
      </QueryStateView>
    </AppShell>
  );
}
