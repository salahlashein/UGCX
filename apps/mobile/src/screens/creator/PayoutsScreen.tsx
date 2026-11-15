import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  FlatList,
  TextInput as RNTextInput,
  Alert,
} from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { CreatorEarningsStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { AppBottomSheet } from '../../components/ui/BottomSheet';
import { colors, spacing, radius } from '../../theme/tokens';
import { useCreatorEarnings, useCreatorLedger, useRequestPayout } from '../../hooks/api/useCreator';
import { isFeatureEnabled } from '../../config/features';

const METHODS = [
  { id: 'instapay', title: 'InstaPay', meta: 'Default payout method', fastest: true },
  { id: 'vodafone', title: 'Vodafone Cash', meta: 'Mobile wallet', fastest: false },
  { id: 'bank', title: 'Bank transfer', meta: 'Standard transfer', fastest: false },
];

type Props = NativeStackScreenProps<CreatorEarningsStackParamList, 'Earnings'>;

/**
 * TASK-P3-12: PayoutsScreen (Creator Screen 12).
 * Reads string amounts from ledger and formats numbers with Intl.NumberFormat.
 * Maps statusToken to design system tokens (muted, success).
 */
export function PayoutsScreen(_props?: Partial<Props>) {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const { data: earnings } = useCreatorEarnings();
  const { data: ledger, refetch: refetchLedger } = useCreatorLedger();
  const requestPayout = useRequestPayout();

  const [method, setMethod] = useState('instapay');
  const [amount, setAmount] = useState('0');

  useEffect(() => {
    if (earnings?.pendingBalance) {
      setAmount(earnings.pendingBalance);
    }
  }, [earnings]);

  const formatAmount = (val: string | undefined) => {
    const num = Math.round(Number(val || 0));
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handleRequestPayout = () => {
    const pendingNum = Number(earnings?.pendingBalance || 0);
    if (pendingNum <= 0) {
      Alert.alert(
        t('common.notice', 'Notice'),
        t('creator.payout.noFunds', 'You have no withdrawable balance.'),
      );
      return;
    }
    bottomSheetRef.current?.present();
  };

  const handleSubmitPayout = async () => {
    try {
      await requestPayout.mutateAsync({ amount, method });
      bottomSheetRef.current?.dismiss();
      Alert.alert(
        t('common.success', 'Success'),
        t(
          'creator.payout.successMessage',
          'Payout requested successfully. Admin will review within 2 business days.',
        ),
      );
      refetchLedger();
    } catch {
      Alert.alert(
        t('common.error.title', 'Error'),
        t('creator.payout.failedMessage', 'Failed to request payout.'),
      );
    }
  };

  const currency = earnings?.currency || 'EGP';

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={ledger || []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <AppText variant="displayMd" color="ink">
              {t('creator.earnings.title', 'Earnings')}
            </AppText>

            {/* Hero Ready to Withdraw Balance Card matching BrandDashboardScreen spendCard */}
            <Card style={styles.balanceCard}>
              <AppText variant="overline" color="muted" style={styles.kicker}>
                {t('creator.earnings.readyToWithdraw', 'READY TO WITHDRAW')}
              </AppText>
              <AppText variant="metric" color="ink" style={styles.balanceAmount}>
                {currency} {formatAmount(earnings?.pendingBalance)}
              </AppText>
              <Pressable style={styles.cta} onPress={handleRequestPayout}>
                <AppText variant="button" color="onPrimary">
                  {t('creator.earnings.requestPayout', 'Request payout')}
                </AppText>
              </Pressable>
            </Card>

            {/* Escrow & Cleared Balance Stats inside white Cards */}
            <View style={styles.statRow}>
              <Card style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Icon name="shield" size={16} color="primary" />
                </View>
                <AppText variant="titleSm" color="ink" style={styles.tabular}>
                  {currency} {formatAmount(earnings?.escrowBalance)}
                </AppText>
                <AppText variant="bodySm" color="muted">
                  {t('creator.earnings.heldInEscrow', 'Held in escrow')}
                </AppText>
              </Card>
              <Card style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Icon name="check-circle" size={16} color="primary" />
                </View>
                <AppText variant="titleSm" color="ink" style={styles.tabular}>
                  {currency} {formatAmount(earnings?.clearedBalance)}
                </AppText>
                <AppText variant="bodySm" color="muted">
                  {t('creator.earnings.paidOutToDate', 'Paid out to date')}
                </AppText>
              </Card>
            </View>

            <AppText variant="titleSm" color="ink" style={styles.ledgerHeading}>
              {t('creator.earnings.ledger', 'Ledger')}
            </AppText>
          </View>
        }
        renderItem={({ item }) => {
          const isSuccess = item.statusToken === 'success';
          const tokenColor = isSuccess ? colors.success : colors.muted;

          return (
            <Card style={styles.ledgerRow}>
              <View style={styles.ledgerIcon}>
                <Icon name="dollar-sign" size={16} color="primary" />
              </View>
              <View style={{ flex: 1, alignItems: 'flex-start' }}>
                <AppText variant="label" color="ink">
                  {item.title}
                </AppText>
                <AppText variant="bodySm" color="muted">
                  {item.meta}
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="label" color="ink" style={styles.tabular}>
                  {item.sign}
                  {item.amount}
                </AppText>
                <AppText variant="caption" style={{ color: tokenColor }}>
                  {item.status}
                </AppText>
              </View>
            </Card>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <AppText variant="body" color="muted" style={{ textAlign: 'center' }}>
              {t('creator.earnings.noTransactions', 'No transactions yet.')}
            </AppText>
          </Card>
        }
      />

      <AppBottomSheet ref={bottomSheetRef} snapPoints={['85%']}>
        <AppText variant="displayMd" color="ink">
          {t('creator.payout.title', 'Request payout')}
        </AppText>
        <AppText variant="caption" color="muted" style={{ marginBottom: spacing.lg }}>
          {t('creator.payout.availableBalance', 'Available balance {{currency}} {{balance}}', {
            currency,
            balance: formatAmount(earnings?.pendingBalance),
          })}
        </AppText>
        <AppText variant="label" color="ink" style={styles.label}>
          {t('creator.payout.amount', 'Amount')}
        </AppText>
        <View style={styles.amountRow}>
          <AppText variant="body" color="muted">
            {currency}
          </AppText>
          <RNTextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.amountInput}
          />
          <Pressable onPress={() => setAmount(earnings?.pendingBalance || '0')}>
            <AppText variant="label" color="link">
              {t('common.all', 'All')}
            </AppText>
          </Pressable>
        </View>
        <AppText variant="caption" color="muted" style={{ marginBottom: spacing.lg }}>
          {t('creator.payout.minimumAmount', 'Minimum EGP 500 per request.')}
        </AppText>
        <AppText variant="label" color="ink" style={styles.label}>
          {t('creator.payout.sendTo', 'Send to')}
        </AppText>
        {METHODS.map((m) => (
          <Pressable key={m.id} onPress={() => setMethod(m.id)} style={styles.methodRow}>
            <View style={[styles.radio, method === m.id && styles.radioSelected]} />
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              <AppText variant="label" color="ink">
                {m.title}
              </AppText>
              <AppText variant="caption" color="muted">
                {m.meta}
              </AppText>
            </View>
            {m.fastest && (
              <View style={styles.fastestTag}>
                <AppText variant="overline" color="primary">
                  Fastest
                </AppText>
              </View>
            )}
          </Pressable>
        ))}
        <View style={styles.disclosureRow}>
          <View style={styles.disclosureIcon}>
            <Icon name="clock" size={14} color="primary" />
          </View>
          <AppText variant="caption" color="muted" style={{ flex: 1 }}>
            {t(
              'creator.payout.disclosure',
              'Payouts are reviewed and sent by our team within 2 business days. You will get a notification the moment it is transferred.',
            )}
          </AppText>
        </View>
        <Pressable style={styles.cta} onPress={handleSubmitPayout}>
          <AppText variant="button" color="onPrimary">
            {t('creator.payout.requestCta', 'Request {{currency}} {{amount}}', {
              currency,
              amount,
            })}
          </AppText>
        </Pressable>
      </AppBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  balanceCard: {
    borderRadius: radius.xxl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  kicker: {
    letterSpacing: 0.8,
  },
  balanceAmount: {
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.sm,
  },
  cta: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    gap: spacing.xxs,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  ledgerHeading: {
    paddingHorizontal: spacing.xxs,
    marginTop: spacing.xs,
  },
  ledgerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  ledgerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  label: { marginBottom: spacing.xs },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  methodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  radioSelected: { borderWidth: 6, borderColor: colors.primary },
  fastestTag: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
  },
  disclosureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  disclosureIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
