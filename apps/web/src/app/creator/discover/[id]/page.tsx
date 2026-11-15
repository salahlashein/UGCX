'use client';

import React, { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  Icon,
  KpiCells,
  ModalSheet,
  QueryStateView,
  SegmentedControl,
  StatusBadge,
  Tag,
  TextInput,
} from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import { useCampaign } from '../../../../hooks/api/useCampaigns';
import { useCreateProposal, useMyProposals } from '../../../../hooks/api/useProposals';
import { useCreatorProfile, useCreatorStats } from '../../../../hooks/api/useCreator';
import { useTranslation } from '../../../../i18n';
import { extractErrorMessage } from '../../../../services/apiHelpers';
import { formatMoney, getInitials } from '../../../../utils/format';
import { toCents } from '../../../../utils/money';

export default function CreatorCampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = use(params);
  const router = useRouter();
  const { t, locale } = useTranslation();

  const campaignQuery = useCampaign(campaignId);
  const profileQuery = useCreatorProfile();
  const statsQuery = useCreatorStats();
  const proposalsQuery = useMyProposals();
  const createProposal = useCreateProposal(campaignId);

  const [price, setPrice] = useState('1500');
  const [deliveryDays, setDeliveryDays] = useState('5');
  const [pitch, setPitch] = useState('');
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const campaign = campaignQuery.data;
  const creator = profileQuery.data;

  // Check if creator already submitted a proposal for this campaign
  const existingProposal = useMemo(() => {
    const list = proposalsQuery.data?.data || [];
    return list.find((p) => p.campaignId === campaignId);
  }, [proposalsQuery.data?.data, campaignId]);

  // Validation
  const minCents = campaign ? toCents(campaign.budgetMin) : 0;
  const maxCents = campaign ? toCents(campaign.budgetMax) : Infinity;
  const priceCents = toCents(price);
  const isPriceValid = priceCents >= minCents && priceCents <= maxCents;
  const isPitchValid = pitch.trim().length >= 5 && pitch.length <= 600;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPriceValid) {
      setError(
        locale === 'ar'
          ? `يجب أن يكون السعر ضمن ميزانية البريف (${formatMoney(campaign?.budgetMin)} - ${formatMoney(campaign?.budgetMax)})`
          : `Price must be within the brief budget range (${formatMoney(campaign?.budgetMin)} - ${formatMoney(campaign?.budgetMax)}).`,
      );
      return;
    }

    if (!isPitchValid) {
      setError(
        locale === 'ar'
          ? 'يرجى كتابة نبذة توضيحية بين 5 و 600 حرف.'
          : 'Please write a pitch between 5 and 600 characters.',
      );
      return;
    }

    try {
      await createProposal.mutateAsync({
        price: parseInt(price, 10),
        deliveryDays: parseInt(deliveryDays, 10),
        pitch: pitch.trim(),
      });
      proposalsQuery.refetch();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <AppShell requiredRole="creator">
      <QueryStateView
        isLoading={campaignQuery.isLoading || profileQuery.isLoading}
        isError={campaignQuery.isError || profileQuery.isError}
        data={campaignQuery.data}
        onRetry={() => {
          campaignQuery.refetch();
          profileQuery.refetch();
          proposalsQuery.refetch();
        }}
      >
        {(brief) => {
          const brandName =
            (brief as any).brand?.companyName || (locale === 'ar' ? 'علامة تجارية' : 'Brand');
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
              {/* Top Navigation & Title */}
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
                    onClick={() => router.push('/creator/discover')}
                  >
                    ← {locale === 'ar' ? 'البريفات' : 'Discover'}
                  </Button>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
                      {brief.title}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {brandName}
                    </AppText>
                  </div>
                </div>

                <Button variant="secondary" size="sm" onClick={() => setShowBriefModal(true)}>
                  <Icon name="file" size={14} />
                  <span>{locale === 'ar' ? 'قراءة البريف بالكامل' : 'Read full brief'}</span>
                </Button>
              </div>

              {/* Fact Strip Card */}
              <Card elevation="card" style={{ padding: spacing.lg, borderRadius: radius.card }}>
                <KpiCells
                  cells={[
                    {
                      label: locale === 'ar' ? 'نوع الفيديو' : 'Format',
                      value: brief.videoType || 'Video',
                    },
                    {
                      label: locale === 'ar' ? 'المدة' : 'Duration',
                      value: `${brief.durationSeconds}s`,
                    },
                    {
                      label: locale === 'ar' ? 'اللغة' : 'Language',
                      value: brief.language ? brief.language.toUpperCase() : 'AR',
                    },
                    {
                      label: locale === 'ar' ? 'الشحن' : 'Shipping',
                      value: brief.needsShipping
                        ? locale === 'ar'
                          ? `يشحن إلى ${creator?.city || 'مصر'}`
                          : `Ships to ${creator?.city || 'Egypt'}`
                        : locale === 'ar'
                          ? 'بدون شحن'
                          : 'No product shipping',
                    },
                    {
                      label: locale === 'ar' ? 'نطاق الميزانية' : 'Budget range',
                      value: `${formatMoney(brief.budgetMin)} - ${formatMoney(brief.budgetMax)}`,
                    },
                    {
                      label: locale === 'ar' ? 'المتبقي' : 'Closes in',
                      value: daysLeft !== null ? `${daysLeft}d` : '-',
                    },
                  ]}
                />
              </Card>

              {/* 2-Column Application and Live Brand Preview */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.2fr) minmax(300px, 1fr)',
                  gap: spacing.xl,
                  alignItems: 'start',
                }}
              >
                {/* Form or Already Applied State */}
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
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: `1px dashed ${colors.border}`,
                      paddingBottom: spacing.md,
                    }}
                  >
                    <AppText
                      variant="subtitle"
                      style={{ fontWeight: 500, color: colors.textPrimary }}
                    >
                      {existingProposal
                        ? locale === 'ar'
                          ? 'تم تقديم العرض'
                          : 'Proposal submitted'
                        : locale === 'ar'
                          ? 'تقديم عرضك للعلامة التجارية'
                          : 'Your proposal'}
                    </AppText>
                    {existingProposal && (
                      <StatusBadge status={existingProposal.status} domain="custom" />
                    )}
                  </div>

                  {existingProposal ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                      <div
                        style={{
                          padding: spacing.md,
                          backgroundColor: colors.surfaceSoft,
                          borderRadius: radius.card,
                        }}
                      >
                        <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                          {locale === 'ar' ? 'سعرك المقترح' : 'Your offered price'}
                        </AppText>
                        <div
                          style={{
                            fontSize: 24,
                            fontWeight: 500,
                            fontFamily: 'var(--font-mono, monospace)',
                            color: colors.primary,
                            marginTop: spacing.xs,
                            direction: 'ltr',
                            textAlign: 'start',
                          }}
                        >
                          {formatMoney(existingProposal.price)}
                        </div>
                        <AppText
                          variant="caption"
                          color={colors.textSecondary}
                          style={{ marginTop: spacing.xs, display: 'block' }}
                        >
                          {locale === 'ar' ? 'مدة التسليم المقترحة:' : 'Delivery time:'}{' '}
                          {existingProposal.deliveryDays} {locale === 'ar' ? 'أيام' : 'days'}
                        </AppText>
                      </div>

                      <div>
                        <AppText
                          variant="dataMonoCaps"
                          color={colors.textSecondary}
                          style={{ marginBottom: spacing.xs, display: 'block' }}
                        >
                          {locale === 'ar' ? 'نبذة العرض' : 'Pitch'}
                        </AppText>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14,
                            color: colors.textPrimary,
                            lineHeight: 1.5,
                          }}
                        >
                          {existingProposal.pitch}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSubmit}
                      style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}
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

                      {/* Price Field */}
                      <div>
                        <TextInput
                          label={locale === 'ar' ? 'سعرك المقترح (جنيه مصري)' : 'Your price (EGP)'}
                          type="number"
                          value={price}
                          onChangeText={(val) => {
                            setPrice(val);
                            setError(null);
                          }}
                          mono
                          dir="ltr"
                        />
                        <AppText
                          variant="caption"
                          color={colors.textTertiary}
                          style={{ marginTop: 4, display: 'block' }}
                        >
                          {locale === 'ar' ? 'ميزانية البريف:' : 'Brief budget:'}{' '}
                          <span
                            style={{
                              fontFamily: 'var(--font-mono, monospace)',
                              direction: 'ltr',
                              display: 'inline-block',
                            }}
                          >
                            {formatMoney(brief.budgetMin)} - {formatMoney(brief.budgetMax)}
                          </span>
                        </AppText>
                      </div>

                      {/* Delivery Days Segment */}
                      <div>
                        <AppText
                          variant="dataMonoCaps"
                          color={colors.textSecondary}
                          style={{ marginBottom: spacing.sm, display: 'block' }}
                        >
                          {locale === 'ar' ? 'مدة التسليم' : 'Delivery time'}
                        </AppText>
                        <SegmentedControl
                          options={[
                            { label: locale === 'ar' ? '3 أيام' : '3 days', value: '3' },
                            { label: locale === 'ar' ? '5 أيام' : '5 days', value: '5' },
                            { label: locale === 'ar' ? '7 أيام' : '7 days', value: '7' },
                            { label: locale === 'ar' ? '10 أيام' : '10 days', value: '10' },
                          ]}
                          value={deliveryDays}
                          onChange={setDeliveryDays}
                        />
                      </div>

                      {/* Pitch Field with Counter */}
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
                            {locale === 'ar' ? 'نبذة العرض وطريقة التنفيذ' : 'Your pitch'}
                          </AppText>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono, monospace)',
                              fontSize: 11,
                              color: pitch.length > 600 ? colors.danger : colors.textTertiary,
                            }}
                          >
                            {pitch.length} / 600
                          </span>
                        </div>
                        <TextInput
                          value={pitch}
                          onChangeText={(val) => {
                            if (val.length <= 600) setPitch(val);
                            setError(null);
                          }}
                          placeholder={
                            locale === 'ar'
                              ? 'اشرح باختصار كيف ستصور الفيديو، واذكر نقطة محددة من البريف...'
                              : 'Briefly explain your filming concept, mentioning a specific talking point...'
                          }
                          numberOfLines={4}
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        loading={createProposal.isPending}
                        disabled={!isPriceValid || !isPitchValid}
                      >
                        {locale === 'ar' ? 'إرسال العرض' : 'Submit proposal'}
                      </Button>
                    </form>
                  )}
                </Card>

                {/* Brand View Preview Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                  <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                    {locale === 'ar'
                      ? `كيف ترى ${brandName} عرضك`
                      : `How ${brandName} sees your proposal`}
                  </AppText>

                  <Card
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: radius.card,
                            backgroundColor: colors.accentSoft,
                            color: colors.primary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 500,
                            fontSize: 16,
                          }}
                        >
                          {getInitials(creator?.displayName, 'CR')}
                        </div>
                        <div
                          style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}
                        >
                          <AppText
                            variant="subtitle"
                            style={{ fontWeight: 500, color: colors.textPrimary }}
                          >
                            {creator?.displayName || (locale === 'ar' ? 'صانع المحتوى' : 'Creator')}
                          </AppText>
                          <AppText variant="caption" color={colors.textSecondary}>
                            {creator?.city || 'Egypt'} ·{' '}
                            {existingProposal ? existingProposal.deliveryDays : deliveryDays}{' '}
                            {locale === 'ar' ? 'أيام تسليم' : 'days delivery'}
                          </AppText>
                        </div>
                      </div>

                      <div style={{ textAlign: 'end' }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 500,
                            fontSize: 18,
                            color: colors.primary,
                            direction: 'ltr',
                          }}
                        >
                          {formatMoney(existingProposal ? existingProposal.price : price)}
                        </div>
                        <Tag tone="pend">{locale === 'ar' ? 'مقدم' : 'Applied'}</Tag>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: spacing.md,
                        backgroundColor: colors.surfaceSoft,
                        borderRadius: radius.card,
                        fontStyle: 'italic',
                        fontSize: 13,
                        color: colors.textPrimary,
                        lineHeight: 1.5,
                      }}
                    >
                      {existingProposal
                        ? existingProposal.pitch
                        : pitch.trim() ||
                          (locale === 'ar'
                            ? 'سأقوم بتصوير المحتوى بجودة عالية وفقاً لإرشادات البريف بدقة.'
                            : 'I will film the deliverable in natural light according to your guidelines.')}
                    </div>

                    {/* Stats preview row */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: spacing.sm,
                        borderTop: `1px dashed ${colors.border}`,
                        paddingTop: spacing.sm,
                        textAlign: 'center',
                      }}
                    >
                      <div>
                        <AppText variant="caption" color={colors.textSecondary}>
                          {locale === 'ar' ? 'المشاريع' : 'Jobs done'}
                        </AppText>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 500,
                            color: colors.textPrimary,
                            marginTop: 2,
                          }}
                        >
                          {statsQuery.data?.jobsDone ?? 0}
                        </div>
                      </div>
                      <div>
                        <AppText variant="caption" color={colors.textSecondary}>
                          {locale === 'ar' ? 'نسبة القبول' : 'Approval rate'}
                        </AppText>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 500,
                            color: colors.textPrimary,
                            marginTop: 2,
                          }}
                        >
                          {statsQuery.data?.approvalRate ?? 100}%
                        </div>
                      </div>
                      <div>
                        <AppText variant="caption" color={colors.textSecondary}>
                          {locale === 'ar' ? 'متوسط التعديلات' : 'Avg revisions'}
                        </AppText>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 500,
                            color: colors.textPrimary,
                            marginTop: 2,
                          }}
                        >
                          {statsQuery.data?.averageRevisions ?? 0}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Full Brief Modal Sheet */}
              <ModalSheet
                isOpen={showBriefModal}
                onClose={() => setShowBriefModal(false)}
                title={brief.title}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.lg,
                    padding: spacing.md,
                  }}
                >
                  <div>
                    <AppText
                      variant="dataMonoCaps"
                      color={colors.textSecondary}
                      style={{ marginBottom: spacing.xs, display: 'block' }}
                    >
                      {locale === 'ar' ? 'نص البريف' : 'Brief description'}
                    </AppText>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: colors.textPrimary,
                        lineHeight: 1.6,
                      }}
                    >
                      {brief.brief}
                    </p>
                  </div>

                  {brief.talkingPoints && brief.talkingPoints.length > 0 && (
                    <div>
                      <AppText
                        variant="dataMonoCaps"
                        color={colors.textSecondary}
                        style={{ marginBottom: spacing.xs, display: 'block' }}
                      >
                        {locale === 'ar' ? 'نقاط الحديث المطلوبة' : 'Talking points'}
                      </AppText>
                      <ul
                        style={{
                          margin: 0,
                          paddingInlineStart: spacing.lg,
                          fontSize: 14,
                          color: colors.textPrimary,
                          lineHeight: 1.6,
                        }}
                      >
                        {brief.talkingPoints.map((tp, idx) => (
                          <li key={idx}>{tp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {brief.doNotSay && brief.doNotSay.length > 0 && (
                    <div>
                      <AppText
                        variant="dataMonoCaps"
                        color={colors.danger}
                        style={{ marginBottom: spacing.xs, display: 'block' }}
                      >
                        {locale === 'ar' ? 'ما يجب تجنبه (Do Not Say)' : 'Do not say'}
                      </AppText>
                      <ul
                        style={{
                          margin: 0,
                          paddingInlineStart: spacing.lg,
                          fontSize: 14,
                          color: colors.danger,
                          lineHeight: 1.6,
                        }}
                      >
                        {brief.doNotSay.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ModalSheet>
            </div>
          );
        }}
      </QueryStateView>
    </AppShell>
  );
}
