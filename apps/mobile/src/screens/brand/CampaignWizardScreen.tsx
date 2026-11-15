import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useController, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BrandCampaignsStackParamList } from '../../navigation/types';
import {
  useCampaign,
  useCreateCampaign,
  usePublishCampaign,
  useUpdateCampaign,
} from '../../hooks/api/useCampaigns';
import { useProducts } from '../../hooks/api/useProducts';
import { parseApiError } from '../../services/apiError';
import { FormTextInput } from '../../components/forms/FormTextInput';
import { ChipSelect } from '../../components/forms/ChipSelect';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { colors, spacing, typography } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandCampaignsStackParamList, 'CampaignWizard'>;

const NICHES = [
  'beauty_personal_care',
  'fashion',
  'mom_baby',
  'food_fmcg',
  'home_lifestyle',
  'other',
] as const;
const VIDEO_TYPES = ['unboxing', 'testimonial', 'demo', 'tutorial', 'other'] as const;
const LANGUAGES = ['ar', 'en'] as const;
const SCRIPT_MODES = ['brand', 'creator'] as const;

// A numeric-string field (rather than z.coerce.number()) keeps the
// schema's input and output types identical, which is what
// react-hook-form's Resolver generic requires; Number() conversion
// happens once, at submit time, in onPublish below.
export function numericString(min: number, max: number) {
  return z
    .string()
    .min(1)
    .refine((val) => Number.isInteger(Number(val)) && Number(val) >= min && Number(val) <= max, {
      message: `Must be a whole number between ${min} and ${max}`,
    });
}

export const campaignWizardSchema = z.object({
  productId: z.string().min(1),
  niche: z.enum(NICHES),
  language: z.enum(LANGUAGES),
  videoType: z.enum(VIDEO_TYPES),
  durationSeconds: numericString(5, 600),
  scriptMode: z.enum(SCRIPT_MODES).optional(),
  script: z.string().optional(),
  talkingPoints: z.string().optional(),
  doNotSay: z.string().optional(),
  needsShipping: z.boolean(),
  slots: numericString(1, 50),
});
type FormValues = z.infer<typeof campaignWizardSchema>;

const STEPS = ['product', 'details', 'script', 'shipping', 'review'] as const;
const STEP_FIELDS: Record<(typeof STEPS)[number], (keyof FormValues)[]> = {
  product: ['productId'],
  details: ['niche', 'language', 'videoType', 'durationSeconds'],
  script: ['scriptMode', 'script', 'talkingPoints', 'doNotSay'],
  shipping: ['needsShipping', 'slots'],
  review: [],
};

function splitLines(value: string | undefined): string[] {
  return (value ?? '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** TASK-P1-006: REQ-004, Zod mirrors the API's missingPublishFields so errors surface before the call too. */
export function CampaignWizardScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const existingCampaignId = route.params?.campaignId;
  const campaignQuery = useCampaign(existingCampaignId);
  const productsQuery = useProducts();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const publishCampaign = usePublishCampaign();

  const [stepIndex, setStepIndex] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const campaignIdRef = useRef<string | undefined>(existingCampaignId);

  const { control, handleSubmit, trigger, reset, setError, getValues } = useForm<FormValues>({
    resolver: zodResolver(campaignWizardSchema),
    defaultValues: {
      productId: '',
      needsShipping: false,
      slots: '1',
      durationSeconds: '30',
    },
  });

  useEffect(() => {
    const campaign = campaignQuery.data;
    if (campaign) {
      reset({
        productId: campaign.productId ?? '',
        niche: (campaign.niche ?? undefined) as FormValues['niche'],
        language: (campaign.language ?? undefined) as FormValues['language'],
        videoType: (campaign.videoType ?? undefined) as FormValues['videoType'],
        durationSeconds: String(campaign.durationSeconds ?? 30),
        scriptMode: (campaign.scriptMode ?? undefined) as FormValues['scriptMode'],
        script: campaign.script ?? '',
        talkingPoints: campaign.talkingPoints.join('\n'),
        doNotSay: campaign.doNotSay.join('\n'),
        needsShipping: campaign.needsShipping,
        slots: String(campaign.slots),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignQuery.data]);

  if (existingCampaignId && campaignQuery.isLoading) {
    return <LoadingState />;
  }

  const step = STEPS[stepIndex];

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (!valid) return;
    setFormError(null);

    if (step === 'product' && !campaignIdRef.current) {
      try {
        const productId = getValues('productId');
        const created = await createCampaign.mutateAsync({ productId });
        campaignIdRef.current = created.id;
      } catch (error) {
        setFormError(parseApiError(error).message);
        return;
      }
    }
    setStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
  };

  const goBack = () => setStepIndex((index) => Math.max(index - 1, 0));

  const onPublish = handleSubmit(async (values) => {
    if (!campaignIdRef.current) return;
    setFormError(null);
    try {
      await updateCampaign.mutateAsync({
        id: campaignIdRef.current,
        dto: {
          niche: values.niche,
          language: values.language,
          videoType: values.videoType,
          durationSeconds: Number(values.durationSeconds),
          scriptMode: values.scriptMode,
          script: values.script,
          talkingPoints: splitLines(values.talkingPoints),
          doNotSay: splitLines(values.doNotSay),
          needsShipping: values.needsShipping,
          slots: Number(values.slots),
        },
      });
      await publishCampaign.mutateAsync(campaignIdRef.current);
      navigation.navigate('MyBriefs');
    } catch (error) {
      const parsed = parseApiError(error);
      parsed.details?.forEach((detail) => {
        if (detail.field in campaignWizardSchema.shape) {
          setError(detail.field as keyof FormValues, { message: detail.message });
        }
      });
      setFormError(parsed.message);
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.stepLabel}>{t(`brand.wizard.step${capitalize(step)}`)}</Text>
        {formError ? (
          <Text style={styles.error} accessibilityRole="alert">
            {formError}
          </Text>
        ) : null}

        {step === 'product' && (
          <ProductStep
            control={control}
            products={productsQuery.data?.data}
            loading={productsQuery.isLoading}
          />
        )}
        {step === 'details' && <DetailsStep control={control} />}
        {step === 'script' && <ScriptStep control={control} />}
        {step === 'shipping' && <ShippingStep control={control} />}
        {step === 'review' && <ReviewStep values={getValues()} />}

        <View style={styles.navRow}>
          {stepIndex > 0 && (
            <Button title={t('common.back')} variant="secondary" onPress={goBack} />
          )}
          {step !== 'review' ? (
            <Button title={t('common.next')} onPress={goNext} />
          ) : (
            <Button
              title={t('brand.wizard.publish')}
              onPress={onPublish}
              loading={updateCampaign.isPending || publishCampaign.isPending}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ProductStep({
  control,
  products,
  loading,
}: {
  control: ReturnType<typeof useForm<FormValues>>['control'];
  products: { id: string; name: string }[] | undefined;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const { field, fieldState } = useControllerField(control, 'productId');
  if (loading) return <LoadingState />;
  if (!products || products.length === 0) {
    return <Text style={styles.hint}>{t('brand.products.empty')}</Text>;
  }
  return (
    <ChipSelect
      label={t('brand.wizard.selectProduct')}
      options={products.map((product) => ({ value: product.id, label: product.name }))}
      value={field.value}
      onChange={(value) => field.onChange(value)}
      error={fieldState.error?.message}
    />
  );
}

function DetailsStep({ control }: { control: ReturnType<typeof useForm<FormValues>>['control'] }) {
  const { t } = useTranslation();
  const niche = useControllerField(control, 'niche');
  const language = useControllerField(control, 'language');
  const videoType = useControllerField(control, 'videoType');
  return (
    <View>
      <ChipSelect
        label={t('brand.wizard.niche')}
        options={NICHES.map((value) => ({ value, label: t(`niche.${value}`) }))}
        value={niche.field.value}
        onChange={niche.field.onChange}
        error={niche.fieldState.error?.message}
      />
      <ChipSelect
        label={t('brand.wizard.language')}
        options={[
          { value: 'en', label: 'English' },
          { value: 'ar', label: 'العربية' },
        ]}
        value={language.field.value}
        onChange={language.field.onChange}
        error={language.fieldState.error?.message}
      />
      <ChipSelect
        label={t('brand.wizard.videoType')}
        options={VIDEO_TYPES.map((value) => ({ value, label: value }))}
        value={videoType.field.value}
        onChange={videoType.field.onChange}
        error={videoType.fieldState.error?.message}
      />
      <FormTextInput
        control={control}
        name="durationSeconds"
        label={t('brand.wizard.durationSeconds')}
        keyboardType="number-pad"
      />
    </View>
  );
}

function ScriptStep({ control }: { control: ReturnType<typeof useForm<FormValues>>['control'] }) {
  const { t } = useTranslation();
  const scriptMode = useControllerField(control, 'scriptMode');
  return (
    <View>
      <ChipSelect
        label={t('brand.wizard.scriptMode')}
        options={[
          { value: 'brand', label: t('brand.wizard.scriptModeBrand') },
          { value: 'creator', label: t('brand.wizard.scriptModeCreator') },
        ]}
        value={scriptMode.field.value}
        onChange={scriptMode.field.onChange}
      />
      <FormTextInput control={control} name="script" label={t('brand.wizard.script')} multiline />
      <FormTextInput
        control={control}
        name="talkingPoints"
        label={t('brand.wizard.talkingPoints')}
        multiline
      />
      <FormTextInput
        control={control}
        name="doNotSay"
        label={t('brand.wizard.doNotSay')}
        multiline
      />
    </View>
  );
}

function ShippingStep({ control }: { control: ReturnType<typeof useForm<FormValues>>['control'] }) {
  const { t } = useTranslation();
  const needsShipping = useControllerField(control, 'needsShipping');
  return (
    <View>
      <ChipSelect
        label={t('brand.wizard.needsShipping')}
        options={[
          { value: 'yes', label: t('common.done') },
          { value: 'no', label: t('common.cancel') },
        ]}
        value={needsShipping.field.value ? 'yes' : 'no'}
        onChange={(value) => needsShipping.field.onChange(value === 'yes')}
      />
      <FormTextInput
        control={control}
        name="slots"
        label={t('brand.wizard.slots')}
        keyboardType="number-pad"
      />
    </View>
  );
}

function ReviewStep({ values }: { values: FormValues }) {
  const { t } = useTranslation();
  return (
    <View>
      <Text style={styles.reviewLine}>
        {t('brand.wizard.niche')}: {values.niche}
      </Text>
      <Text style={styles.reviewLine}>
        {t('brand.wizard.language')}: {values.language}
      </Text>
      <Text style={styles.reviewLine}>
        {t('brand.wizard.videoType')}: {values.videoType}
      </Text>
      <Text style={styles.reviewLine}>
        {t('brand.wizard.durationSeconds')}: {values.durationSeconds}
      </Text>
      <Text style={styles.reviewLine}>
        {t('brand.wizard.slots')}: {values.slots}
      </Text>
    </View>
  );
}

// A small local helper so every step avoids repeating the Controller boilerplate.
function useControllerField<K extends keyof FormValues>(
  control: ReturnType<typeof useForm<FormValues>>['control'],
  name: K,
) {
  return useController({ control, name });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg },
  stepLabel: { ...typography.title, color: colors.ink, marginBottom: spacing.md },
  error: { ...typography.body, color: colors.danger, marginBottom: spacing.md },
  hint: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  navRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  reviewLine: { ...typography.body, color: colors.ink, marginBottom: spacing.xs },
});
