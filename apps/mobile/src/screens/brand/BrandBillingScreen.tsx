import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BillingEntry } from '@ugcx/shared-types';
import type { BrandProfileStackParamList } from '../../navigation/types';
import { useBilling } from '../../hooks/api/useBilling';
import { SignatureCard } from '../../components/ui/SignatureCard';
import { Card } from '../../components/ui/Card';
import { AppText } from '../../components/ui/Text';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { parseApiError } from '../../services/apiError';
import { colors, radius, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandProfileStackParamList, 'BrandBilling'>;

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * TASK-P2-13: BrandBillingScreen (artboard 4f).
 * Displays lifetime spend dark SignatureCard and hairline separated transaction ledger.
 */
export function BrandBillingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const billingQuery = useBilling();

  if (billingQuery.isLoading) {
    return <LoadingState />;
  }

  if (billingQuery.isError) {
    return (
      <ErrorState
        message={parseApiError(billingQuery.error).message}
        onRetry={() => billingQuery.refetch()}
      />
    );
  }

  const data = billingQuery.data;
  const entries = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? (data as any) : [];
  const lifetimeSpend = data?.summary?.lifetimeSpend ?? '0.00';
  const currency = data?.summary?.currency ?? 'EGP';

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={billingQuery.isRefetching}
            onRefresh={() => billingQuery.refetch()}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="titleLg" color="ink" style={styles.title}>
              {t('brand.billing.title', 'Billing')}
            </AppText>

            {/* Dark Lifetime Spend Card (artboard 4f) */}
            <SignatureCard variant="dark" style={styles.summaryCard}>
              <AppText variant="label" color="muted" style={styles.summaryKicker}>
                {t('brand.billing.lifetimeSpend', 'LIFETIME SPEND')}
              </AppText>
              <View style={styles.amountRow}>
                <AppText variant="displayLg" color="onPrimary">
                  {currency}{' '}
                </AppText>
                <AppText variant="displayLg" color="onPrimary">
                  {lifetimeSpend}
                </AppText>
              </View>
            </SignatureCard>

            <AppText variant="titleSm" color="ink" style={styles.ledgerHeader}>
              {t('brand.billing.history', 'Transaction history')}
            </AppText>
          </View>
        }
        renderItem={({ item, index }) => (
          <BillingRow
            entry={item}
            isLast={index === entries.length - 1}
          />
        )}
        ListEmptyComponent={
          <Card tone="canvas" style={styles.emptyCard}>
            <AppText variant="body" color="muted" style={styles.textCenter}>
              {t('brand.billing.empty', 'No billing transactions recorded yet.')}
            </AppText>
          </Card>
        }
      />
    </SafeAreaView>
  );
}

function BillingRow({ entry, isLast }: { entry: BillingEntry; isLast: boolean }) {
  const isRefund = entry.type === 'refund';
  const sign = isRefund ? '+' : '-';
  const amountColor = isRefund ? colors.success : colors.ink;

  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.rowInfo}>
        <AppText variant="body" color="ink" numberOfLines={1}>
          {entry.label}
        </AppText>
        <AppText variant="caption" color="muted" style={styles.rowMeta}>
          {entry.method} · {formatDate(entry.createdAt)}
        </AppText>
      </View>
      <View style={styles.rowAmount}>
        <AppText variant="body" style={{ color: amountColor }}>
          {sign}{entry.currency}{' '}
        </AppText>
        <AppText variant="body" style={{ color: amountColor }}>
          {entry.amount}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.md,
  },
  summaryCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  summaryKicker: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ledgerHeader: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    backgroundColor: colors.canvas,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowInfo: {
    flex: 1,
    marginEnd: spacing.md,
  },
  rowMeta: {
    marginTop: spacing.xxs,
  },
  rowAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  textCenter: {
    textAlign: 'center',
  },
});
