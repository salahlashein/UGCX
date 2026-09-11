# Collaboration Detail (1e)

Escrow amount card + vertical stage timeline + shipment confirmation prompt.

```jsx
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

const STAGES = [
  { title: 'Proposal accepted', meta: '28 Aug · EGP 3,200 agreed', state: 'done' },
  { title: 'Escrow funded', meta: '28 Aug · paid by card', state: 'done' },
  { title: 'Product shipped to you', meta: '30 Aug · AWB 8842 191 003 · Bosta', state: 'current' },
  { title: 'Film and upload', meta: 'Due 4 Sep', state: 'upcoming' },
];

export default function CollaborationDetailScreen({ onConfirmShipment, onChat }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View style={styles.header}>
        <Text style={styles.back}>‹</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>Glow Lab</Text>
          <Text style={styles.meta}>Collaboration #1042</Text>
        </View>
        <View style={styles.statusTag}><Text style={styles.statusTagText}>Funded</Text></View>
      </View>
      <Text style={[type.displayMd, { color: colors.ink, marginBottom: spacing.lg }]}>Vitamin C serum review</Text>
      <View style={styles.escrowCard}>
        <Text style={styles.escrowKicker}>HELD IN ESCROW</Text>
        <Text style={styles.escrowAmount}>EGP 3,200</Text>
        <Text style={styles.escrowBody}>Releases to your balance when Glow Lab approves your video.</Text>
      </View>
      <Text style={[type.titleLg, { color: colors.ink, marginBottom: 16 }]}>Where we are</Text>
      {STAGES.map((s, i) => (
        <View key={s.title} style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ alignItems: 'center', width: 16 }}>
            <View style={[styles.node, s.state === 'done' && styles.nodeDone, s.state === 'current' && styles.nodeCurrent]} />
            {i < STAGES.length - 1 && <View style={styles.connector} />}
          </View>
          <View style={{ paddingBottom: 20, flex: 1 }}>
            <Text style={[styles.stageTitle, s.state === 'upcoming' && { color: colors.borderStrong }]}>{s.title}</Text>
            <Text style={[styles.stageMeta, s.state === 'upcoming' && { color: colors.borderStrong }]}>{s.meta}</Text>
            {s.state === 'current' && (
              <View style={styles.confirmCard}>
                <Text style={styles.body}>Did it arrive? Confirming starts your 5-day filming window.</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable style={styles.cta} onPress={onConfirmShipment}><Text style={styles.ctaText}>It arrived</Text></Pressable>
                  <Pressable style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>Not yet</Text></Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      ))}
      <Pressable style={styles.chatRow} onPress={onChat}>
        <View style={styles.chatAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.stageTitle}>Chat with Glow Lab</Text>
          <Text style={styles.stageMeta}>Last message 2h ago</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>1</Text></View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.lg },
  back: { fontSize: 20, color: colors.ink },
  brand: { ...type.label, color: colors.ink },
  meta: { ...type.caption, color: colors.muted },
  statusTag: { backgroundColor: colors.yellow, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 11 },
  statusTagText: { ...type.caption, fontWeight: '500', color: colors.ink },
  escrowCard: { backgroundColor: colors.forest, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl },
  escrowKicker: { fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.6, color: 'rgba(255,255,255,0.75)', marginBottom: 10 },
  escrowAmount: { ...type.displayMd, color: colors.onPrimary, marginBottom: 6 },
  escrowBody: { ...type.body, color: 'rgba(255,255,255,0.85)' },
  node: { width: 14, height: 14, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderStrong },
  nodeDone: { backgroundColor: colors.success, borderWidth: 0 },
  nodeCurrent: { borderWidth: 4, borderColor: colors.primary },
  connector: { flex: 1, width: 1, backgroundColor: colors.hairline },
  stageTitle: { ...type.label, color: colors.ink },
  stageMeta: { ...type.caption, color: colors.muted, marginBottom: 12 },
  confirmCard: { borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.md, padding: spacing.md },
  body: { ...type.body, color: colors.body, marginBottom: 14 },
  cta: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' },
  ctaText: { ...type.label, color: colors.onPrimary },
  secondaryBtn: { borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 16 },
  secondaryBtnText: { ...type.label, color: colors.ink },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.md, padding: spacing.md, marginTop: 6 },
  chatAvatar: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.cream },
  badge: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 9 },
  badgeText: { ...type.caption, fontWeight: '500', color: colors.onPrimary },
});

```
