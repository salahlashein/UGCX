import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useBrandProfile, useUpdateBrandProfile } from '../../hooks/api/useBrand';
import { useLogout } from '../../hooks/api/useAuth';
import { parseApiError } from '../../services/apiError';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FormTextInput } from '../../components/forms/FormTextInput';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme/tokens';

interface FormValues {
  companyName: string;
  country: string;
}

/** Directory Map: brand/BrandProfileScreen.tsx */
export function BrandProfileScreen() {
  const { t } = useTranslation();
  const profileQuery = useBrandProfile();
  const updateProfile = useUpdateBrandProfile();
  const logout = useLogout();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { companyName: '', country: '' },
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        companyName: profileQuery.data.companyName ?? '',
        country: profileQuery.data.country,
      });
    }
  }, [profileQuery.data, reset]);

  if (profileQuery.isLoading) return <LoadingState />;
  if (profileQuery.isError) {
    return (
      <ErrorState
        message={parseApiError(profileQuery.error).message}
        onRetry={profileQuery.refetch}
      />
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await updateProfile.mutateAsync(values);
    } catch (error) {
      setFormError(parseApiError(error).message);
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {formError ? (
          <Text style={styles.error} accessibilityRole="alert">
            {formError}
          </Text>
        ) : null}
        <FormTextInput
          control={control}
          name="companyName"
          label={t('brand.profile.companyName')}
        />
        <FormTextInput control={control} name="country" label={t('brand.profile.country')} />
        <Button title={t('common.save')} onPress={onSubmit} loading={updateProfile.isPending} />
        <Button title={t('common.logout')} variant="secondary" onPress={() => logout.mutate()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, gap: spacing.md },
  error: { ...typography.body, color: colors.danger, marginBottom: spacing.md },
});
