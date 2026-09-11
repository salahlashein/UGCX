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
import type { CreatorEarningsStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { AppBottomSheet } from '../../components/ui/BottomSheet';
import { colors, spacing, radius } from '../../theme/tokens';
import { useCreatorEarnings, useCreatorLedger, useRequestPayout } from '../../hooks/api/useCreator';

const METHODS = [
  { id: 'instapay', title: 'InstaPay', meta: 'Default payout method', fastest: true },
  { id: 'vodafone', title: 'Vodafone Cash', meta: 'Mobile wallet', fastest: false },
  { id: 'bank', title: 'Bank transfer', meta: 'Standard transfer', fastest: false },
];

type Props = NativeStackScreenProps<CreatorEarningsStackParamList, 'Earnings'>;

export function PayoutsScreen() {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const { data: earnings } = useCreatorEarnings();
  const { data: ledger, refetch: refetchLedger } = useCreatorLedger();
  const requestPayout = useRequestPayout();

  const [method, setMethod] = useState('instapay');
  const [amount, setAmount] = useState('0');

  useEffect(() => {
    if (earnings?.pendingBalance) {
      setAmount(earnings.pendingBalance.toString());
    }
  }, [earnings]);

  const handleRequestPayout = () => {
    if (!earnings?.pendingBalance || earnings.pendingBalance <= 0) {
      Alert.alert('No funds', 'You have no withdrawable balance.');
      return;
    }
    bottomSheetRef.current?.present();
  };

  const handleSubmitPayout = async () => {
    try {
      await requestPayout.mutateAsync({ amount, method });
      bottomSheetRef.current?.dismiss();
      Alert.alert(
        'Success',
        'Payout requested successfully. Admin will review within 2 business days.',
      );
      refetchLedger();
    } catch (e) {
      Alert.alert('Error', 'Failed to request payout.');
    }
  };

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.screen}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
        data={ledger || []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <AppText
              variant="displayMd"
              color="ink"
              style={{ marginBottom: spacing.lg, marginTop: spacing.lg }}
            >
              Earnings
            </AppText>
            <View style={styles.balanceCard}>
              <AppText style={styles.kicker}>READY TO WITHDRAW</AppText>
              <AppText style={styles.balanceAmount}>EGP {earnings?.pendingBalance || 0}</AppText>
              <Pressable style={styles.cta} onPress={handleRequestPayout}>
                <AppText variant="label" color="onPrimary">
                  Request payout
                </AppText>
              </Pressable>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <AppText variant="titleLg" color="ink">
                  EGP {earnings?.escrowBalance || 0}
                </AppText>
                <AppText variant="caption" color="muted">
                  Held in escrow
                </AppText>
              </View>
              <View style={styles.statCard}>
                <AppText variant="titleLg" color="ink">
                  EGP {earnings?.clearedBalance || 0}
                </AppText>
                <AppText variant="caption" color="muted">
                  Paid out to date
                </AppText>
              </View>
            </View>
            <AppText variant="titleLg" color="ink" style={{ marginBottom: 8 }}>
              Ledger
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.ledgerRow}>
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              <AppText variant="label" color="ink">
                {item.title}
              </AppText>
              <AppText variant="caption" color="muted">
                {item.meta}
              </AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="label" color="ink">
                {item.amount}
              </AppText>
              <AppText variant="caption" style={{ color: item.statusColor, fontWeight: '500' }}>
                {item.status}
              </AppText>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <AppText variant="body" color="muted" style={{ textAlign: 'center', marginTop: 40 }}>
            No transactions yet.
          </AppText>
        }
      />

      <AppBottomSheet ref={bottomSheetRef} snapPoints={['85%']}>
        <AppText variant="displayMd" color="ink">
          Request payout
        </AppText>
        <AppText variant="caption" color="muted" style={{ marginBottom: spacing.lg }}>
          Available balance EGP {earnings?.pendingBalance || 0}
        </AppText>
        <AppText variant="label" color="ink" style={styles.label}>
          Amount
        </AppText>
        <View style={styles.amountRow}>
          <AppText variant="body" color="muted">
            EGP
          </AppText>
          <RNTextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.amountInput}
          />
          <Pressable onPress={() => setAmount(earnings?.pendingBalance?.toString() || '0')}>
            <AppText variant="label" style={{ color: colors.link, fontSize: 13 }}>
              All
            </AppText>
          </Pressable>
        </View>
        <AppText variant="caption" color="muted" style={{ marginBottom: spacing.lg }}>
          Minimum EGP 500 per request.
        </AppText>
        <AppText variant="label" color="ink" style={styles.label}>
          Send to
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
                <AppText variant="caption" style={styles.fastestText}>
                  Fastest
                </AppText>
              </View>
            )}
          </Pressable>
        ))}
        <View style={styles.disclosureRow}>
          <View style={styles.disclosureDot} />
          <AppText variant="caption" color="muted" style={{ flex: 1 }}>
            Payouts are reviewed and sent by our team within 2 business days. You'll get a
            notification the moment it's transferred.
          </AppText>
        </View>
        <Pressable style={styles.cta} onPress={handleSubmitPayout}>
          <AppText variant="label" color="onPrimary">
            Request EGP {amount}
          </AppText>
        </Pressable>
      </AppBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  balanceCard: {
    backgroundColor: colors.signatureCream,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  kicker: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.muted,
    marginBottom: 10,
  },
  balanceAmount: { fontSize: 32, lineHeight: 38, color: colors.ink, marginBottom: 16 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.xl },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  ledgerRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  label: { marginBottom: 8 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  amountInput: { flex: 1, fontSize: 17, fontWeight: '600', color: colors.ink },
  methodRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
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
    backgroundColor: colors.signatureMint,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  fastestText: { fontWeight: '500', color: colors.signatureForest },
  disclosureRow: { flexDirection: 'row', gap: 10, marginVertical: spacing.md },
  disclosureDot: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.signatureYellow,
    marginTop: 3,
  },
});
