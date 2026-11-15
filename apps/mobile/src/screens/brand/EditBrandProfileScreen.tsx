import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Niche } from '@ugcx/shared-types';
import type { BrandProfileStackParamList } from '../../navigation/types';
import { useBrandProfile, useUpdateBrandProfile } from '../../hooks/api/useBrand';
import { parseApiError } from '../../services/apiError';
import { FormTextInput } from '../../components/forms/FormTextInput';
import { ChipSelect } from '../../components/forms/ChipSelect';
import { Button } from '../../components/ui/Button';
import { BottomActionBar } from '../../components/ui/BottomActionBar';
import { AppText } from '../../components/ui/Text';
import { LoadingState } from '../../components/ui/LoadingState';
import { colors, spacing } from '../../theme/tokens';
import { BRIEF_NICHES } from './PostBriefScreen';

type Props = NativeStackScreenProps<BrandProfileStackParamList, 'EditBrandProfile'>;

interface FormValues {
  companyName: string;
  country: string;
  category: Niche | '';
}

/** Edits the brand's name, country and category. Opened from "Edit profile". */
export function EditBrandProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const profileQuery = useBrandProfile();
  const updateProfile = useUpdateBrandProfile();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { companyName: '', country: '', category: '' },
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        companyName: profileQuery.data.companyName ?? '',
        country: profileQuery.data.country,
        category: profileQuery.data.category ?? '',
      });
    }
  }, [profileQuery.data, reset]);

  if (profileQuery.isLoading) return <LoadingState />;

  const categoryOptions = BRIEF_NICHES.map((value) => ({ value, label: t(`niche.${value}`) }));

  const onSave = handleSubmit(async ({ companyName, country, category }) => {
    setFormError(null);
    try {
      await updateProfile.mutateAsync({
        companyName: companyName.trim(),
        country: country.trim(),
        ...(category ? { category } : {}),
      });
      navigation.goBack();
    } catch (error) {
      setFormError(parseApiError(error).message);
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormTextInput
          control={control}
          name="companyName"
          label={t('brand.profile.companyName')}
        />
        <FormTextInput control={control} name="country" label={t('brand.profile.country')} />
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <ChipSelect
              label={t('brand.brief.niche')}
              options={categoryOptions}
              value={value}
              onChange={(val) => onChange(val as string)}
            />
          )}
        />
      </ScrollView>
      <BottomActionBar>
        <View style={styles.actions}>
          {formError ? (
            <AppText variant="caption" color="danger" accessibilityRole="alert">
              {formError}
            </AppText>
          ) : null}
          <Button title={t('common.save')} loading={updateProfile.isPending} onPress={onSave} />
        </View>
      </BottomActionBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg },
  actions: { width: '100%', gap: spacing.xs },
});
