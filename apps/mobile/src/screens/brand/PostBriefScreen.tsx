import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BrandBriefsStackParamList } from '../../navigation/types';
import { useCreateCampaign } from '../../hooks/api/useCampaigns';
import { parseApiError } from '../../services/apiError';
import { AppText } from '../../components/ui/Text';
import { FormTextInput } from '../../components/forms/FormTextInput';
import { ChipSelect } from '../../components/forms/ChipSelect';
import { Icon, type IconName } from '../../components/ui/Icon';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BottomActionBar } from '../../components/ui/BottomActionBar';
import { colors, radius, spacing } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';
import { formatAmount } from '../../utils/format';

export const BRIEF_NICHES = [
  'beauty_personal_care',
  'fashion',
  'mom_baby',
  'food_fmcg',
  'home_lifestyle',
  'other',
] as const;

export const postBriefSchema = z
  .object({
    title: z.string().min(3, 'brand.brief.errors.title').max(140, 'brand.brief.errors.title'),
    videoType: z.enum(['talking_head', 'try_on', 'unboxing'], {
      message: 'brand.brief.errors.deliverable',
    }),
    niche: z.enum(BRIEF_NICHES).default('beauty_personal_care'),
    durationSeconds: z.string().refine(
      (val) => {
        const n = Number(val);
        return Number.isInteger(n) && n >= 5 && n <= 600;
      },
      { message: 'brand.brief.errors.length' },
    ),
    language: z.enum(['ar', 'en'], {
      message: 'brand.brief.errors.language',
    }),
    budgetMin: z.string().refine(
      (val) => {
        const n = Number(val);
        return !isNaN(n) && n >= 100;
      },
      { message: 'brand.brief.errors.budgetMin' },
    ),
    budgetMax: z.string(),
    needsShipping: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const min = Number(data.budgetMin);
      const max = Number(data.budgetMax);
      return !isNaN(max) && max >= min;
    },
    {
      message: 'brand.brief.errors.budgetMax',
      path: ['budgetMax'],
    },
  );

export type PostBriefFormData = z.infer<typeof postBriefSchema>;

export function transformBriefPayload(data: PostBriefFormData) {
  return {
    title: data.title.trim(),
    videoType: data.videoType,
    niche: data.niche,
    durationSeconds: Number(data.durationSeconds),
    language: data.language,
    budgetMin: Number(data.budgetMin).toFixed(2),
    budgetMax: Number(data.budgetMax).toFixed(2),
    needsShipping: Boolean(data.needsShipping),
  };
}

type Props = NativeStackScreenProps<BrandBriefsStackParamList, 'PostBrief'>;

export type BriefStep = 'basics' | 'video' | 'budget' | 'review';
export const BRIEF_STEPS: BriefStep[] = ['basics', 'video', 'budget', 'review'];

/** Fields checked before the brand may leave each step. */
export const BRIEF_STEP_FIELDS: Record<BriefStep, FieldPath<PostBriefFormData>[]> = {
  basics: ['title', 'niche'],
  video: ['videoType', 'durationSeconds', 'language'],
  budget: ['budgetMin', 'budgetMax', 'needsShipping'],
  review: [],
};

const VIDEO_TYPES: { value: PostBriefFormData['videoType']; icon: IconName }[] = [
  { value: 'talking_head', icon: 'mic' },
  { value: 'try_on', icon: 'shopping-bag' },
  { value: 'unboxing', icon: 'package' },
];

const LENGTHS = ['15', '30', '60', '90'];

/**
 * TASK-P1-13: Post brief screen (artboard 3b).
 * 2026-10-03 redesign ("B2 step by step"): one question per step, then a review.
 * The 5-step wizard stays reachable for product, script and slot settings.
 */
export function PostBriefScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const createCampaign = useCreateCampaign();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const step = BRIEF_STEPS[stepIndex];

  const {
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<PostBriefFormData>({
    resolver: zodResolver(postBriefSchema) as any,
    defaultValues: {
      title: '',
      videoType: 'talking_head',
      niche: 'beauty_personal_care',
      durationSeconds: '30',
      language: 'ar',
      budgetMin: '500',
      budgetMax: '1500',
      needsShipping: false,
    },
  });

  const values = watch();
  const editLabel = t('brand.brief.steps.edit', 'Edit');
  const nicheOptions = BRIEF_NICHES.map((value) => ({ value, label: t(`niche.${value}`) }));
  const languageOptions = [
    { value: 'ar', label: t('brand.brief.languages.ar') },
    { value: 'en', label: t('brand.brief.languages.en') },
  ];
  const secondsLabel = (value: string) =>
    t('brand.brief.steps.seconds', '{{count}}s', { count: Number(value) });
  const lengthOptions = LENGTHS.map((value) => ({ value, label: secondsLabel(value) }));

  const budgetMin = Number(values.budgetMin);
  const budgetMax = Number(values.budgetMax);
  // FundEscrowScreen funds the midpoint of the range by default.
  const escrowEstimate =
    budgetMin > 0 && budgetMax >= budgetMin ? Math.round((budgetMin + budgetMax) / 2) : null;

  const goNext = async () => {
    const valid = await trigger(BRIEF_STEP_FIELDS[step]);
    if (valid) setStepIndex((index) => Math.min(index + 1, BRIEF_STEPS.length - 1));
  };
  const goBack = () => setStepIndex((index) => Math.max(index - 1, 0));

  const onSubmit = async (data: PostBriefFormData) => {
    setSubmitError(null);
    try {
      const payload = transformBriefPayload(data);
      const created = await createCampaign.mutateAsync(payload);
      navigation.navigate('FundEscrow', { campaignId: created.id });
    } catch (err) {
      setSubmitError(parseApiError(err).message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <AppText variant="bodySm" color="muted" style={styles.stepCount}>
            {t('brand.brief.steps.stepOf', 'Step {{step}} of {{total}}', {
              step: stepIndex + 1,
              total: BRIEF_STEPS.length,
            })}
          </AppText>
          <View
            style={styles.progressRow}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 1, max: BRIEF_STEPS.length, now: stepIndex + 1 }}
          >
            {BRIEF_STEPS.map((key, index) => (
              <View
                key={key}
                style={[styles.progressSegment, index <= stepIndex && styles.progressSegmentDone]}
              />
            ))}
          </View>

          {step === 'basics' && (
            <View>
              <StepTitle
                title={t('brand.brief.steps.basicsTitle', 'What is this brief about?')}
                hint={t('brand.brief.steps.basicsHint', 'Creators see the title first.')}
              />
              <FormTextInput
                control={control}
                name="title"
                label={t('brand.brief.fieldTitle')}
                placeholder={t('brand.brief.steps.titlePlaceholder', 'Iced latte unboxing')}
              />
              <Controller
                control={control}
                name="niche"
                render={({ field: { onChange, value } }) => (
                  <ChipSelect
                    label={t('brand.brief.niche')}
                    options={nicheOptions}
                    value={value}
                    onChange={(val) => onChange(val as string)}
                  />
                )}
              />
              <Pressable
                accessibilityRole="link"
                onPress={() => navigation.navigate('CampaignWizard')}
                style={styles.wizardLink}
                hitSlop={8}
              >
                <AppText variant="bodySm" color="link">
                  {t(
                    'brand.brief.steps.wizardLink',
                    'Need a product, script or more slots? Use the full wizard',
                  )}
                </AppText>
              </Pressable>
            </View>
          )}

          {step === 'video' && (
            <View>
              <StepTitle
                title={t('brand.brief.steps.videoTitle', 'What kind of video do you need?')}
                hint={t('brand.brief.steps.videoHint', 'Pick the format, length and language.')}
              />
              <Controller
                control={control}
                name="videoType"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.optionList} accessibilityRole="radiogroup">
                    {VIDEO_TYPES.map((option) => {
                      const selected = value === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          onPress={() => onChange(option.value)}
                          style={({ pressed }) => [
                            styles.optionCard,
                            selected && styles.optionCardSelected,
                            pressed && styles.pressed,
                          ]}
                        >
                          <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                            <Icon
                              name={option.icon}
                              size={18}
                              color={selected ? 'onPrimary' : 'primary'}
                            />
                          </View>
                          <View style={styles.flex}>
                            <AppText variant="label" color="ink">
                              {t(`brand.brief.types.${option.value}`)}
                            </AppText>
                            <AppText variant="bodySm" color="muted">
                              {t(`brand.brief.steps.typeHints.${option.value}`)}
                            </AppText>
                          </View>
                          {selected ? <Icon name="check-circle" size={20} color="primary" /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
              <Controller
                control={control}
                name="durationSeconds"
                render={({ field: { onChange, value } }) => (
                  <ChipSelect
                    label={t('brand.brief.length')}
                    options={lengthOptions}
                    value={value}
                    onChange={(val) => onChange(val as string)}
                    error={
                      errors.durationSeconds?.message
                        ? t(errors.durationSeconds.message)
                        : undefined
                    }
                  />
                )}
              />
              <Controller
                control={control}
                name="language"
                render={({ field: { onChange, value } }) => (
                  <ChipSelect
                    label={t('brand.brief.language')}
                    options={languageOptions}
                    value={value}
                    onChange={(val) => onChange(val as string)}
                  />
                )}
              />
            </View>
          )}

          {step === 'budget' && (
            <View>
              <StepTitle
                title={t('brand.brief.steps.budgetTitle', 'What is your budget per video?')}
                hint={t(
                  'brand.brief.steps.budgetHint',
                  'Creators set their price inside this range. You fund escrow next.',
                )}
              />
              <View style={styles.budgetRow}>
                <View style={styles.flex}>
                  <FormTextInput
                    control={control}
                    name="budgetMin"
                    label={t('brand.brief.minBudget')}
                    placeholder="500"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.flex}>
                  <FormTextInput
                    control={control}
                    name="budgetMax"
                    label={t('brand.brief.maxBudget')}
                    placeholder="1500"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              {errors.budgetMax?.message ? (
                <AppText variant="caption" color="danger" style={styles.fieldError}>
                  {t(errors.budgetMax.message)}
                </AppText>
              ) : null}
              <Controller
                control={control}
                name="needsShipping"
                render={({ field: { onChange, value } }) => (
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityState={{ checked: Boolean(value) }}
                    onPress={() => onChange(!value)}
                    style={({ pressed }) => [styles.optionCard, pressed && styles.pressed]}
                  >
                    <View style={styles.optionIcon}>
                      <Icon name="truck" size={18} color="primary" />
                    </View>
                    <View style={styles.flex}>
                      <AppText variant="label" color="ink">
                        {t('brand.brief.shipping')}
                      </AppText>
                      <AppText variant="bodySm" color="muted">
                        {t(
                          'brand.brief.steps.shippingHint',
                          'Turn on when creators need the product in hand.',
                        )}
                      </AppText>
                    </View>
                    <View style={[styles.switchTrack, value && styles.switchTrackOn]}>
                      <View style={[styles.switchThumb, value && styles.switchThumbOn]} />
                    </View>
                  </Pressable>
                )}
              />
            </View>
          )}

          {step === 'review' && (
            <View>
              <StepTitle
                title={t('brand.brief.steps.reviewTitle', 'Check your brief')}
                hint={t('brand.brief.steps.reviewHint', 'Tap Edit to change a step.')}
              />
              <Card style={styles.reviewCard}>
                <ReviewRow
                  label={t('brand.brief.fieldTitle')}
                  value={values.title}
                  editLabel={editLabel}
                  onEdit={() => setStepIndex(0)}
                />
                <ReviewRow
                  label={t('brand.brief.niche')}
                  value={t(`niche.${values.niche}`)}
                  editLabel={editLabel}
                  onEdit={() => setStepIndex(0)}
                  divider
                />
                <ReviewRow
                  label={t('brand.brief.deliverable')}
                  value={[
                    t(`brand.brief.types.${values.videoType}`),
                    secondsLabel(values.durationSeconds),
                    t(`brand.brief.languages.${values.language}`),
                  ].join(' · ')}
                  editLabel={editLabel}
                  onEdit={() => setStepIndex(1)}
                  divider
                />
                <ReviewRow
                  label={t('brand.brief.budgetRange')}
                  value={[
                    `EGP ${formatAmount(budgetMin)}–${formatAmount(budgetMax)}`,
                    values.needsShipping ? t('brand.brief.shipping') : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  editLabel={editLabel}
                  onEdit={() => setStepIndex(2)}
                  divider
                />
              </Card>
              {escrowEstimate !== null ? (
                <View style={styles.estimate}>
                  <Icon name="lock" size={16} color="primary" />
                  <AppText variant="bodySm" color="body" style={styles.flex}>
                    {t(
                      'brand.brief.steps.escrowEstimate',
                      'Next you fund about EGP {{amount}} into escrow. Creators are paid only after you approve.',
                      { amount: formatAmount(escrowEstimate) },
                    )}
                  </AppText>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>

        <BottomActionBar>
          <View style={styles.actionCol}>
            {submitError ? (
              <AppText variant="caption" color="danger" accessibilityRole="alert">
                {submitError}
              </AppText>
            ) : null}
            <View style={styles.actionRow}>
              {stepIndex > 0 ? (
                <View style={styles.backButton}>
                  <Button title={t('common.back', 'Back')} variant="secondary" onPress={goBack} />
                </View>
              ) : null}
              <View style={styles.flex}>
                {step === 'review' ? (
                  <Button
                    title={t('brand.brief.reviewAndFund')}
                    variant="primary"
                    loading={createCampaign.isPending}
                    onPress={handleSubmit(onSubmit)}
                  />
                ) : (
                  <Button
                    title={t('common.continue', 'Continue')}
                    variant="primary"
                    onPress={goNext}
                  />
                )}
              </View>
            </View>
          </View>
        </BottomActionBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <View style={styles.stepTitle}>
      <AppText variant="displayMd" color="ink" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="body" color="muted">
        {hint}
      </AppText>
    </View>
  );
}

function ReviewRow({
  label,
  value,
  editLabel,
  onEdit,
  divider,
}: {
  label: string;
  value: string;
  editLabel: string;
  onEdit: () => void;
  divider?: boolean;
}) {
  return (
    <View style={[styles.reviewRow, divider && styles.reviewDivider]}>
      <View style={styles.flex}>
        <AppText variant="bodySm" color="muted">
          {label}
        </AppText>
        <AppText variant="label" color="ink">
          {value}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${editLabel} ${label}`}
        onPress={onEdit}
        hitSlop={10}
      >
        <AppText variant="bodySm" color="link">
          {editLabel}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  stepCount: { marginBottom: spacing.xs },
  progressRow: { flexDirection: 'row', gap: spacing.xxs, marginBottom: spacing.lg },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
  },
  progressSegmentDone: { backgroundColor: colors.primary },
  stepTitle: { gap: spacing.xxs, marginBottom: spacing.lg },
  wizardLink: { marginTop: spacing.xs, alignSelf: 'flex-start' },
  optionList: { gap: spacing.xs, marginBottom: spacing.md },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    ...elevation.soft,
  },
  optionCardSelected: { borderColor: colors.primary },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: { backgroundColor: colors.primary },
  pressed: { transform: [{ scale: 0.98 }] },
  budgetRow: { flexDirection: 'row', gap: spacing.md },
  fieldError: { marginTop: -spacing.xs, marginBottom: spacing.md },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceStrong,
    padding: 3,
  },
  switchTrackOn: { backgroundColor: colors.primary },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  switchThumbOn: { alignSelf: 'flex-end' },
  reviewCard: { padding: 0 },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  reviewDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  estimate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
  },
  actionCol: { width: '100%', gap: spacing.xs },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  backButton: { width: 110 },
});
