'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Campaign, Language, Niche, VideoType } from '@ugcx/shared-types';
import {
  AppText,
  Button,
  Card,
  Icon,
  KeyValueList,
  RangeSlider,
  SegmentedControl,
  Tag,
  TextInput,
} from '../ui';
import { colors, radius, spacing } from '../../theme/tokens';
import { useCreateCampaign, useUpdateCampaign } from '../../hooks/api/useCampaigns';
import { useBrandRole } from '../../hooks/useBrandRole';
import { useTranslation } from '../../i18n';
import { extractErrorMessage } from '../../services/apiHelpers';
import { formatMoney } from '../../utils/format';
import { toCents, centsToAmount } from '../../utils/money';

const NICHES: { key: Niche; labelEn: string; labelAr: string }[] = [
  { key: 'beauty_personal_care', labelEn: 'Beauty & Care', labelAr: 'الجمال والعناية' },
  { key: 'fashion', labelEn: 'Fashion', labelAr: 'الأزياء والموضة' },
  { key: 'food_fmcg', labelEn: 'Food & FMCG', labelAr: 'الأغذية والمشروبات' },
  { key: 'mom_baby', labelEn: 'Mom & Baby', labelAr: 'الأم والطفل' },
  { key: 'home_lifestyle', labelEn: 'Home & Lifestyle', labelAr: 'المنزل ونمط الحياة' },
  { key: 'other', labelEn: 'Other', labelAr: 'أخرى' },
];

const VIDEO_FORMATS: { key: VideoType; labelEn: string; labelAr: string; icon: string }[] = [
  { key: 'unboxing', labelEn: 'Unboxing', labelAr: 'فتح الصندوق', icon: 'package' },
  { key: 'testimonial', labelEn: 'Testimonial', labelAr: 'تجربة شخصية', icon: 'user' },
  { key: 'demo', labelEn: 'Product Demo', labelAr: 'استعراض المنتج', icon: 'play' },
  { key: 'tutorial', labelEn: 'Tutorial / How-To', labelAr: 'دليل استخدام', icon: 'file' },
  { key: 'talking_head', labelEn: 'Talking Head', labelAr: 'تحدث مباشر', icon: 'video' },
  { key: 'try_on', labelEn: 'Try-On Haul', labelAr: 'تجربة ملابس', icon: 'bag' },
  { key: 'other', labelEn: 'Other', labelAr: 'أخرى', icon: 'more-horizontal' },
];

interface BriefFormProps {
  initialData?: Campaign;
  isEdit?: boolean;
}

export function BriefForm({ initialData, isEdit = false }: BriefFormProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { can, role: memberRole } = useBrandRole();

  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();

  // Basics
  const [title, setTitle] = useState(initialData?.title || '');
  const [niche, setNiche] = useState<Niche>(initialData?.niche || 'beauty_personal_care');
  const [needsShipping, setNeedsShipping] = useState(initialData?.needsShipping ?? false);

  // Video
  const [videoType, setVideoType] = useState<VideoType>(initialData?.videoType || 'unboxing');
  const [durationSeconds, setDurationSeconds] = useState<number>(
    initialData?.durationSeconds || 30,
  );
  const [revisionLimit, setRevisionLimit] = useState<number>(initialData?.revisionLimit ?? 2);
  const [language, setLanguage] = useState<Language>(initialData?.language || 'ar');
  const [briefText, setBriefText] = useState(initialData?.brief || '');
  const [talkingPointsText, setTalkingPointsText] = useState(
    initialData?.talkingPoints ? initialData.talkingPoints.join('\n') : '',
  );
  const [doNotSayText, setDoNotSayText] = useState(
    initialData?.doNotSay ? initialData.doNotSay.join('\n') : '',
  );

  // Budget & Timeline
  const [budgetMin, setBudgetMin] = useState<number>(
    initialData?.budgetMin ? Math.round(Number(initialData.budgetMin)) : 1500,
  );
  const [budgetMax, setBudgetMax] = useState<number>(
    initialData?.budgetMax ? Math.round(Number(initialData.budgetMax)) : 3500,
  );
  const [slots, setSlots] = useState<number>(initialData?.slots || 1);

  // 14 days default closesAt
  const defaultClosesAt = useMemo(() => {
    if (initialData?.closesAt) return initialData.closesAt.slice(0, 10);
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  }, [initialData?.closesAt]);

  const [closesAt, setClosesAt] = useState(defaultClosesAt);
  const [error, setError] = useState<string | null>(null);

  const isViewer = memberRole === 'viewer';

  // Section completion status
  const isBasicsComplete = title.trim().length >= 3 && title.trim().length <= 140;
  const isVideoComplete = briefText.trim().length >= 10;
  const isBudgetComplete = budgetMin >= 100 && budgetMax >= budgetMin && slots >= 1;
  const isFormValid = isBasicsComplete && isVideoComplete && isBudgetComplete;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid) {
      setError(
        locale === 'ar'
          ? 'يرجى استكمال جميع الحقول المطلوبة بالشكل الصحيح.'
          : 'Please complete all required fields correctly.',
      );
      return;
    }

    const talkingPoints = talkingPointsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const doNotSay = doNotSayText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      brief: briefText.trim(),
      niche,
      language,
      videoType,
      durationSeconds,
      revisionLimit,
      needsShipping,
      budgetMin,
      budgetMax,
      slots,
      closesAt: new Date(closesAt).toISOString(),
      talkingPoints: talkingPoints.length > 0 ? talkingPoints : undefined,
      doNotSay: doNotSay.length > 0 ? doNotSay : undefined,
    };

    try {
      if (isEdit && initialData) {
        await updateCampaign.mutateAsync({
          id: initialData.id,
          dto: payload,
        });
        router.push(`/brand/briefs/${initialData.id}`);
      } else {
        const created = await createCampaign.mutateAsync(payload);
        router.push(`/brand/briefs/${created.id}/fund`);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  if (isViewer) {
    return (
      <Card
        elevation="card"
        style={{ padding: spacing.xl, textAlign: 'center', borderRadius: radius.card }}
      >
        <AppText variant="subtitle" style={{ fontWeight: 500, color: colors.textPrimary }}>
          {locale === 'ar' ? 'صلاحيات المشاهدة فقط' : 'Read-only access'}
        </AppText>
        <AppText variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
          {locale === 'ar'
            ? 'لا تملك صلاحيات إنشاء أو تعديل البريفات.'
            : 'Viewer role cannot create or edit briefs.'}
        </AppText>
      </Card>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}
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

      {/* 2-Column: Form Sections and Sticky Live Preview */}
      <div
        className="ugcx-two-column-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
          gap: spacing.xl,
          alignItems: 'start',
        }}
      >
        {/* Form Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {/* Section 1: Basics */}
          <Card
            elevation="card"
            style={{
              padding: spacing.xl,
              borderRadius: radius.card,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="subtitle" style={{ fontWeight: 500, color: colors.textPrimary }}>
                1. {locale === 'ar' ? 'المعلومات الأساسية' : 'Basics'}
              </AppText>
              {isBasicsComplete ? (
                <Tag tone="done">{locale === 'ar' ? 'مكتمل' : 'Complete'}</Tag>
              ) : (
                <Tag tone="muted">{locale === 'ar' ? 'مطلوب' : 'Required'}</Tag>
              )}
            </div>

            <TextInput
              label={locale === 'ar' ? 'عنوان البريف' : 'Brief title'}
              placeholder={
                locale === 'ar'
                  ? 'مثال: إطلاق منتج القهوة المثلجة للصيف'
                  : 'e.g. Summer Cold Brew Launch'
              }
              value={title}
              onChangeText={setTitle}
            />

            <div>
              <AppText
                variant="dataMonoCaps"
                color={colors.textSecondary}
                style={{ marginBottom: spacing.xs, display: 'block' }}
              >
                {locale === 'ar' ? 'مجال البريف' : 'Niche'}
              </AppText>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: spacing.xs,
                }}
              >
                {NICHES.map((n) => (
                  <button
                    key={n.key}
                    type="button"
                    onClick={() => setNiche(n.key)}
                    style={{
                      padding: `${spacing.xs}px ${spacing.sm}px`,
                      borderRadius: radius.chip,
                      border: `1px solid ${niche === n.key ? colors.primary : colors.border}`,
                      backgroundColor: niche === n.key ? colors.accentSoft : colors.surface,
                      color: niche === n.key ? colors.primary : colors.textPrimary,
                      fontWeight: niche === n.key ? 500 : 400,
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {locale === 'ar' ? n.labelAr : n.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                marginTop: spacing.xs,
              }}
            >
              <input
                type="checkbox"
                id="needsShippingCheckbox"
                checked={needsShipping}
                onChange={(e) => setNeedsShipping(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: colors.primary, cursor: 'pointer' }}
              />
              <label
                htmlFor="needsShippingCheckbox"
                style={{ fontSize: 14, color: colors.textPrimary, cursor: 'pointer' }}
              >
                {locale === 'ar'
                  ? 'يتطلب شحن عينة منتج فعلية إلى صانع المحتوى'
                  : 'Requires shipping a physical product sample to creator'}
              </label>
            </div>
          </Card>

          {/* Section 2: Video Specifications */}
          <Card
            elevation="card"
            style={{
              padding: spacing.xl,
              borderRadius: radius.card,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="subtitle" style={{ fontWeight: 500, color: colors.textPrimary }}>
                2. {locale === 'ar' ? 'مواصفات الفيديو' : 'Video requirements'}
              </AppText>
              {isVideoComplete ? (
                <Tag tone="done">{locale === 'ar' ? 'مكتمل' : 'Complete'}</Tag>
              ) : (
                <Tag tone="muted">{locale === 'ar' ? 'مطلوب' : 'Required'}</Tag>
              )}
            </div>

            {/* Video Format Tiles */}
            <div>
              <AppText
                variant="dataMonoCaps"
                color={colors.textSecondary}
                style={{ marginBottom: spacing.xs, display: 'block' }}
              >
                {locale === 'ar' ? 'نوع وقالب الفيديو' : 'Format / Video type'}
              </AppText>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: spacing.xs,
                }}
              >
                {VIDEO_FORMATS.map((fmt) => (
                  <button
                    key={fmt.key}
                    type="button"
                    onClick={() => setVideoType(fmt.key)}
                    style={{
                      padding: `${spacing.sm}px ${spacing.xs}px`,
                      borderRadius: radius.chip,
                      border: `1px solid ${videoType === fmt.key ? colors.primary : colors.border}`,
                      backgroundColor: videoType === fmt.key ? colors.accentSoft : colors.surface,
                      color: videoType === fmt.key ? colors.primary : colors.textPrimary,
                      fontWeight: videoType === fmt.key ? 500 : 400,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Icon name={fmt.icon as any} size={16} />
                    <span>{locale === 'ar' ? fmt.labelAr : fmt.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Length, Language & Revision Segments */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <div
                className="ugcx-two-input-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: spacing.md,
                }}
              >
                <div>
                  <AppText
                    variant="dataMonoCaps"
                    color={colors.textSecondary}
                    style={{ marginBottom: spacing.xs, display: 'block' }}
                  >
                    {locale === 'ar' ? 'مدة الفيديو' : 'Duration'}
                  </AppText>
                  <SegmentedControl
                    fullWidth
                    options={[
                      { label: '15s', value: '15' },
                      { label: '30s', value: '30' },
                      { label: '45s', value: '45' },
                      { label: '60s', value: '60' },
                    ]}
                    value={String(durationSeconds)}
                    onChange={(val) => setDurationSeconds(parseInt(val, 10))}
                  />
                </div>

                <div>
                  <AppText
                    variant="dataMonoCaps"
                    color={colors.textSecondary}
                    style={{ marginBottom: spacing.xs, display: 'block' }}
                  >
                    {locale === 'ar' ? 'اللغة' : 'Language'}
                  </AppText>
                  <SegmentedControl
                    fullWidth
                    options={[
                      { label: 'العربية', value: 'ar' },
                      { label: 'English', value: 'en' },
                    ]}
                    value={language}
                    onChange={(val) => setLanguage(val as Language)}
                  />
                </div>
              </div>

              <div>
                <AppText
                  variant="dataMonoCaps"
                  color={colors.textSecondary}
                  style={{ marginBottom: spacing.xs, display: 'block' }}
                >
                  {locale === 'ar' ? 'الحد الأقصى للتعديلات' : 'Revision limit'}
                </AppText>
                <SegmentedControl
                  fullWidth
                  options={[
                    { label: '0', value: '0' },
                    { label: '1', value: '1' },
                    { label: '2', value: '2' },
                    { label: '3', value: '3' },
                    { label: '4', value: '4' },
                    { label: '5', value: '5' },
                  ]}
                  value={String(revisionLimit)}
                  onChange={(val) => setRevisionLimit(parseInt(val, 10))}
                />
              </div>
            </div>

            {/* Brief Instructions */}
            <TextInput
              label={
                locale === 'ar'
                  ? 'وصف البريف والإرشادات الفنية'
                  : 'Brief description & creative concept'
              }
              placeholder={
                locale === 'ar'
                  ? 'اشرح بالتفصيل فكرة الفيديو والزاوية الإبداعية...'
                  : 'Describe the video concept, style, and setting...'
              }
              value={briefText}
              onChangeText={setBriefText}
              numberOfLines={4}
            />

            {/* Talking Points & Do Not Say */}
            <TextInput
              label={
                locale === 'ar'
                  ? 'نقاط الحديث المطلوبة (نقطة في كل سطر)'
                  : 'Talking points (one per line)'
              }
              placeholder={
                locale === 'ar'
                  ? 'أظهر المنتج في أول 3 ثوانٍ\nاذكر ميزة خالي من السكر'
                  : 'Show the product in the first 3 seconds\nMention no added sugar'
              }
              value={talkingPointsText}
              onChangeText={setTalkingPointsText}
              numberOfLines={3}
            />

            <TextInput
              label={
                locale === 'ar'
                  ? 'محظورات وممنوعات (Do Not Say) (نقطة في كل سطر)'
                  : 'Do not say / Avoid (one per line)'
              }
              placeholder={
                locale === 'ar'
                  ? 'لا تذكر علامات تجارية منافسة\nلا تستخدم موسيقى محمية'
                  : 'Do not mention competing brands\nDo not use copyrighted music'
              }
              value={doNotSayText}
              onChangeText={setDoNotSayText}
              numberOfLines={2}
            />
          </Card>

          {/* Section 3: Budget & Timeline */}
          <Card
            elevation="card"
            style={{
              padding: spacing.xl,
              borderRadius: radius.card,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="subtitle" style={{ fontWeight: 500, color: colors.textPrimary }}>
                3. {locale === 'ar' ? 'الميزانية والمواعيد' : 'Budget & timeline'}
              </AppText>
              {isBudgetComplete ? (
                <Tag tone="done">{locale === 'ar' ? 'مكتمل' : 'Complete'}</Tag>
              ) : (
                <Tag tone="muted">{locale === 'ar' ? 'مطلوب' : 'Required'}</Tag>
              )}
            </div>

            {/* Budget Range Inputs */}
            <div
              className="ugcx-two-input-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.md }}
            >
              <TextInput
                label={locale === 'ar' ? 'الحد الأدنى للسعر (EGP)' : 'Min price (EGP)'}
                type="number"
                value={String(budgetMin)}
                onChangeText={(val) => setBudgetMin(parseInt(val, 10) || 0)}
                mono
                dir="ltr"
              />
              <TextInput
                label={locale === 'ar' ? 'الحد الأقصى للسعر (EGP)' : 'Max price (EGP)'}
                type="number"
                value={String(budgetMax)}
                onChangeText={(val) => setBudgetMax(parseInt(val, 10) || 0)}
                mono
                dir="ltr"
              />
            </div>

            {/* Slots and ClosesAt */}
            <div
              className="ugcx-two-input-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.md }}
            >
              <TextInput
                label={locale === 'ar' ? 'عدد الصناع المطلوبين' : 'Creator slots'}
                type="number"
                value={String(slots)}
                onChangeText={(val) => setSlots(Math.max(1, parseInt(val, 10) || 1))}
                mono
                dir="ltr"
              />
              <TextInput
                label={locale === 'ar' ? 'تاريخ إغلاق استقبال العروض' : 'Proposals deadline'}
                type="date"
                value={closesAt}
                onChangeText={setClosesAt}
                mono
                dir="ltr"
              />
            </div>
          </Card>
        </div>

        {/* Right Column: Sticky Summary & Discover Preview */}
        <div
          className="ugcx-sticky-sidebar"
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}
        >
          {/* Summary Card */}
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
            <AppText variant="subtitle" style={{ fontWeight: 500, color: colors.textPrimary }}>
              {locale === 'ar' ? 'ملخص البريف' : 'Brief summary'}
            </AppText>

            <KeyValueList
              items={[
                {
                  key: locale === 'ar' ? 'المجال' : 'Niche',
                  value:
                    locale === 'ar'
                      ? NICHES.find((n) => n.key === niche)?.labelAr || niche
                      : NICHES.find((n) => n.key === niche)?.labelEn || niche,
                },
                {
                  key: locale === 'ar' ? 'المدة' : 'Duration',
                  value:
                    locale === 'ar'
                      ? `${durationSeconds} ثانية · ${language === 'ar' ? 'عربي' : 'إنجليزي'}`
                      : `${durationSeconds}s · ${language.toUpperCase()}`,
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
                      {formatMoney(budgetMin)} - {formatMoney(budgetMax)}
                    </span>
                  ),
                },
                {
                  key: locale === 'ar' ? 'الصناع المطلوبون' : 'Slots',
                  value: `${slots}`,
                },
              ]}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={createCampaign.isPending || updateCampaign.isPending}
              disabled={!isFormValid}
            >
              {isEdit
                ? locale === 'ar'
                  ? 'حفظ التعديلات'
                  : 'Save changes'
                : locale === 'ar'
                  ? 'متابعة وتمويل الضمان'
                  : 'Review & fund escrow'}
            </Button>
          </Card>

          {/* Creator Discover Preview Card */}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                {locale === 'ar' ? 'معاينة العرض في الاستكشاف' : 'Creator Discover Preview'}
              </AppText>
              <Tag tone="muted">PREVIEW</Tag>
            </div>

            <div
              style={{
                padding: spacing.md,
                backgroundColor: colors.canvas,
                borderRadius: radius.card,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.xs,
              }}
            >
              <AppText variant="caption" color={colors.textSecondary}>
                {locale === 'ar'
                  ? NICHES.find((n) => n.key === niche)?.labelAr || niche
                  : NICHES.find((n) => n.key === niche)?.labelEn || niche}
              </AppText>
              <AppText variant="subtitle" style={{ fontWeight: 500, color: colors.textPrimary }}>
                {title || (locale === 'ar' ? 'عنوان البريف' : 'Brief title')}
              </AppText>
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: colors.primary,
                  direction: 'ltr',
                  textAlign: 'start',
                  marginTop: 2,
                }}
              >
                {formatMoney(budgetMin)} - {formatMoney(budgetMax)}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: spacing.xs,
                  flexWrap: 'wrap',
                  marginTop: spacing.xs,
                }}
              >
                <Tag tone="muted">{`${durationSeconds}s`}</Tag>
                <Tag tone="muted">{language.toUpperCase()}</Tag>
                {needsShipping && (
                  <Tag tone="done">{locale === 'ar' ? 'شحن منتج' : 'Ships product'}</Tag>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
