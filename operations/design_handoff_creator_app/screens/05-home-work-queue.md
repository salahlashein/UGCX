# Home — Work Queue (1a)

Deadline-first home. Coral card is the single urgent task; hairline rows below.

```jsx
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

export default function HomeWorkQueueScreen({ onUpload, onOpenTask }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>NH</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>Nour Hassan</Text>
          <Text style={styles.meta}>Cairo · Beauty & personal care</Text>
        </View>
        <View style={styles.bell}><View style={styles.dot} /></View>
      </View>
      <Text style={[type.displayMd, styles.heading]}>Three things need you</Text>
      <Text style={styles.sub}>Two deliveries and one shipment to confirm.</Text>

      <View style={styles.coralCard}>
        <Text style={styles.coralKicker}>DUE IN 2 DAYS</Text>
        <Text style={styles.coralTitle}>Upload your video for Glow Lab Vitamin C Serum</Text>
        <Text style={styles.coralBody}>EGP 3,200 is held in escrow and releases when the brand approves.</Text>
        <View style={styles.coralActions}>
          <Pressable style={styles.coralPrimaryBtn} onPress={onUpload}>
            <Text style={styles.coralPrimaryBtnText}>Upload deliverable</Text>
          </Pressable>
          <Pressable style={styles.coralSecondaryBtn}>
            <Text style={styles.coralSecondaryBtnText}>Brief</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.row} onPress={onOpenTask}>
        <View style={[styles.rowIcon, { backgroundColor: colors.yellow }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Confirm you received the shipment</Text>
          <Text style={styles.rowMeta}>Bebe Care · AWB 8842 191 003</Text>
        </View>
      </Pressable>
      <Pressable style={styles.row} onPress={onOpenTask}>
        <View style={[styles.rowIcon, { backgroundColor: colors.peach }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Reply to Kanz Modest</Text>
          <Text style={styles.rowMeta}>2 unread messages · asked about lighting</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.lg },
  avatar: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...type.label, color: colors.forest },
  name: { ...type.label, color: colors.ink },
  meta: { ...type.caption, color: colors.muted },
  bell: { width: 40, height: 40, borderRadius: radius.full, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.coral },
  heading: { color: colors.ink, marginBottom: 6 },
  sub: { ...type.body, color: colors.muted, marginBottom: spacing.lg },
  coralCard: { backgroundColor: colors.coral, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  coralKicker: { fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.6, color: 'rgba(255,255,255,0.85)', marginBottom: 10 },
  coralTitle: { ...type.titleLg, color: colors.onPrimary, marginBottom: 8 },
  coralBody: { ...type.body, color: 'rgba(255,255,255,0.9)', marginBottom: spacing.md },
  coralActions: { flexDirection: 'row', gap: 10 },
  coralPrimaryBtn: { backgroundColor: colors.onPrimary, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 20 },
  coralPrimaryBtnText: { ...type.label, color: colors.ink },
  coralSecondaryBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 18 },
  coralSecondaryBtnText: { ...type.label, color: colors.onPrimary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  rowIcon: { width: 40, height: 40, borderRadius: radius.md },
  rowTitle: { ...type.label, color: colors.ink },
  rowMeta: { ...type.caption, color: colors.muted },
  badge: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 9 },
  badgeText: { ...type.caption, fontWeight: '500', color: colors.onPrimary },
});

```
