import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BrandProductsStackParamList } from '../../navigation/types';
import { useCreateProduct, useProduct, useUpdateProduct } from '../../hooks/api/useProducts';
import { parseApiError } from '../../services/apiError';
import { FormTextInput } from '../../components/forms/FormTextInput';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandProductsStackParamList, 'ProductForm'>;

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  valueProps: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

/** Directory Map: create/edit a product, feeding the campaign wizard's product step. */
export function ProductFormScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const productId = route.params?.productId;
  const productQuery = useProduct(productId);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', valueProps: '' },
  });

  useEffect(() => {
    if (productQuery.data) {
      reset({
        name: productQuery.data.name,
        description: productQuery.data.description ?? '',
        valueProps: productQuery.data.valueProps.join('\n'),
      });
    }
  }, [productQuery.data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const valueProps = (values.valueProps ?? '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    try {
      if (productId) {
        await updateProduct.mutateAsync({
          id: productId,
          dto: { name: values.name, description: values.description, valueProps },
        });
      } else {
        await createProduct.mutateAsync({
          name: values.name,
          description: values.description,
          valueProps,
        });
      }
      navigation.goBack();
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
        <FormTextInput control={control} name="name" label={t('brand.products.name')} />
        <FormTextInput
          control={control}
          name="description"
          label={t('brand.products.description')}
          multiline
        />
        <FormTextInput
          control={control}
          name="valueProps"
          label={t('brand.products.valueProps')}
          multiline
        />
        <Button
          title={t('common.save')}
          onPress={onSubmit}
          loading={createProduct.isPending || updateProduct.isPending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg },
  error: { ...typography.body, color: colors.danger, marginBottom: spacing.md },
});
