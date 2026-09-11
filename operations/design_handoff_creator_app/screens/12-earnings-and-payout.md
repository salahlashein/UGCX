# Earnings Screen + Payout Sheet (1g)

Balance card, escrow/paid-to-date stats, transaction ledger, and the payout-request bottom sheet.

```jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Modal, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

const LEDGER = [
  { title: 'Released · Kanz Modest', meta: '2 Sep · collaboration #1039', amount: '+ 3,200', status: 'Withdrawable', statusColor: colors.success },
  { title: 'Held · Glow Lab', meta: '28 Aug · collaboration #1042', amount: '3,200', status: 'In escrow', statusColor: colors.muted },
  { title: 'Payout · InstaPay', meta: '21 Aug · ref PO-2291', amount: '− 5,100', status: 'Paid', statusColor: colors.success },
  { title: 'Released · Nefer Skin', meta: '18 Aug · collaboration #1031', amount: '+ 2,800', status: 'Paid', statusColor: colors.success },
];

export function EarningsScreen({ onRequestPayout }) {
  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
      data={LEDGER}
      keyExtractor={(item, i) => String(i)}
      ListHeaderComponent={
        <View>
          <Text style={[type.displayMd, { color: colors.ink, marginBottom: spacing.lg }]}>Earnings</Text>
          <View style={styles.balanceCard}>
            <Text style={styles.kicker}>READY TO WITHDRAW</Text>
            <Text style={styles.balanceAmount}>EGP 3,200</Text>
            <Pressable style={styles.cta} onPress={onRequestPayout}><Text style={styles.ctaText}>Request payout</Text></Pressable>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statCard}><Text style={styles.statValue}>EGP 6,400</Text><Text style={styles.statLabel}>Held in escrow</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>EGP 12,900</Text><Text style={styles.statLabel}>Paid out to date</Text></View>
          </View>
          <Text style={[type.titleLg, { color: colors.ink, marginBottom: 8 }]}>Ledger</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.ledgerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ledgerTitle}>{item.title}</Text>
            <Text style={styles.ledgerMeta}>{item.meta}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.ledgerTitle}>{item.amount}</Text>
            <Text style={[styles.ledgerStatus, { color: item.statusColor }]}>{item.status}</Text>
          </View>
        </View>
      )}
    />
  );
}

export function PayoutSheet({ visible, onClose, onRequest }) {
  const [method, setMethod] = useState('instapay');
  const [amount, setAmount] = useState('3200');
  const METHODS = [
    { id: 'instapay', title: 'InstaPay', meta: 'nour.hassan@instapay', fastest: true },
    { id: 'vodafone', title: 'Vodafone Cash', meta: '0100 ••• 4471' },
    { id: 'bank', title: 'Bank transfer', meta: 'CIB ••• 8820' },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <Text style={[type.displayMd, { color: colors.ink }]}>Request payout</Text>
        <Text style={[styles.ledgerMeta, { marginBottom: spacing.lg }]}>Available balance EGP 3,200</Text>
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currency}>EGP</Text>
          <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" style={styles.amountInput} />
          <Pressable onPress={() => setAmount('3200')}><Text style={{ color: colors.link, ...type.label, fontSize: 13 }}>All</Text></Pressable>
        </View>
        <Text style={[styles.ledgerMeta, { marginBottom: spacing.lg }]}>Minimum EGP 500 per request.</Text>
        <Text style={styles.label}>Send to</Text>
        {METHODS.map((m) => (
          <Pressable key={m.id} onPress={() => setMethod(m.id)} style={styles.methodRow}>
            <View style={[styles.radio, method === m.id && styles.radioSelected]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.ledgerTitle}>{m.title}</Text>
              <Text style={styles.ledgerMeta}>{m.meta}</Text>
            </View>
            {m.fastest && <View style={styles.fastestTag}><Text style={styles.fastestText}>Fastest</Text></View>}
          </Pressable>
        ))}
        <View style={styles.disclosureRow}>
          <View style={styles.disclosureDot} />
          <Text style={styles.ledgerMeta}>Payouts are reviewed and sent by our team within 2 business days. You'll get a notification the moment it's transferred.</Text>
        </View>
        <Pressable style={styles.cta} onPress={() => onRequest({ amount, method })}>
          <Text style={styles.ctaText}>Request EGP {amount}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  balanceCard: { backgroundColor: colors.cream, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  kicker: { fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.6, color: colors.muted, marginBottom: 10 },
  balanceAmount: { fontSize: 32, lineHeight: 38, color: colors.ink, marginBottom: 16 },
  cta: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  ctaText: { ...type.label, color: colors.onPrimary },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.xl },
  statCard: { flex: 1, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.md, padding: spacing.md },
  statValue: { ...type.titleLg, color: colors.ink },
  statLabel: { ...type.caption, color: colors.muted },
  ledgerRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.hairline },
  ledgerTitle: { ...type.label, color: colors.ink },
  ledgerMeta: { ...type.caption, color: colors.muted },
  ledgerStatus: { ...type.caption, fontWeight: '500' },
  scrim: { flex: 1, backgroundColor: 'rgba(24,29,38,0.45)' },
  sheet: { backgroundColor: colors.canvas, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, paddingBottom: 30 },
  grabber: { width: 44, height: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceStrong, alignSelf: 'center', marginBottom: spacing.lg },
  label: { ...type.label, color: colors.ink, marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: 14, marginBottom: 10 },
  currency: { ...type.body, color: colors.muted },
  amountInput: { flex: 1, ...type.titleMd, color: colors.ink },
  methodRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.hairline },
  radio: { width: 20, height: 20, borderRadius: radius.full, borderWidth: 1, borderColor: colors.inputBorder },
  radioSelected: { borderWidth: 6, borderColor: colors.primary },
  fastestTag: { backgroundColor: colors.mint, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 9 },
  fastestText: { ...type.caption, fontWeight: '500', color: colors.forest },
  disclosureRow: { flexDirection: 'row', gap: 10, marginVertical: spacing.md },
  disclosureDot: { width: 16, height: 16, borderRadius: radius.full, backgroundColor: colors.yellow, marginTop: 3 },
});

```
