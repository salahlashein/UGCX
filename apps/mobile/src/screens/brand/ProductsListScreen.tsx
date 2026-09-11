import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BrandProductsStackParamList } from '../../navigation/types';
import { useProducts } from '../../hooks/api/useProducts';
import { QueryStateView } from '../../components/ui/QueryStateView';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandProductsStackParamList, 'ProductsList'>;

/** TASK-P1-011-adjacent (Directory Map): brand product catalog feeding the campaign wizard. */
export function ProductsListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const query = useProducts();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Button
          title={t('brand.products.addNew')}
          onPress={() => navigation.navigate('ProductForm', undefined)}
        />
      </View>
      <QueryStateView
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data?.data}
        onRetry={query.refetch}
        emptyMessage={t('brand.products.empty')}
      >
        {(products) => (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable onPress={() => navigation.navigate('ProductForm', { productId: item.id })}>
                <Card style={styles.card}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.description}>{item.description}</Text>
                  ) : null}
                </Card>
              </Pressable>
            )}
          />
        )}
      </QueryStateView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  header: { padding: spacing.lg, paddingBottom: 0 },
  list: { padding: spacing.lg, gap: spacing.sm },
  card: { marginBottom: spacing.sm },
  name: { ...typography.subtitle, color: colors.ink },
  description: { ...typography.body, color: colors.muted, marginTop: spacing.xxs },
});
