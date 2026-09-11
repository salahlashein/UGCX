# Pending Vetting Home (1i)

Manual review status, one actionable checklist item, briefs shown locked at 45% opacity.

```jsx
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

export default function PendingVettingScreen({ onAddPayoutDetails }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>MA</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={[type.label, { color: colors.ink }]}>Mariam Adel</Text>
          <Text style={styles.meta}>Alexandria · Beauty</Text>
        </View>
      </View>
      <View style={styles.statusCard}>
        <Text style={styles.kicker}>UNDER REVIEW</Text>
        <Text style={[type.displayMd, { color: colors.onPrimary, marginBottom: 10 }]}>We're checking your profile</Text>
        <Text style={styles.statusBody}>A real person reviews every creator. Most are approved within 48 hours — we'll notify you either way.</Text>
        <View style={styles.progressRow}>
          {[1, 1, 1, 0].map((filled, i) => (
            <View key={i} style={[styles.progressSeg, { opacity: filled ? 1 : 0.3 }]} />
          ))}
        </View>
        <Text style={styles.progressLabel}>3 of 4 steps done</Text>
      </View>
      <View style={styles.checklist}>
        {['Profile and niches', '3 portfolio videos', 'Base price set'].map((label) => (
          <View key={label} style={styles.checkRow}>
            <View style={styles.checkDone}><Text style={styles.checkmark}>✓</Text></View>
            <Text style={styles.checkText}>{label}</Text>
          </View>
        ))}
        <View style={{ padding: 16 }}>
          <View style={[styles.checkRow, { marginBottom: 14 }]}>
            <View style={styles.checkTodo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.checkTextTodo}>Payout details</Text>
              <Text style={styles.meta}>Needed before your first payment</Text>
            </View>
          </View>
          <Pressable style={styles.cta} onPress={onAddPayoutDetails}><Text style={styles.ctaText}>Add payout details</Text></Pressable>
        </View>
      </View>
      <Text style={[type.titleLg, { color: colors.ink, marginBottom: 6 }]}>Briefs you'll be able to apply to</Text>
      <Text style={[styles.meta, { marginBottom: 16 }]}>Applying unlocks the moment you're approved.</Text>
      <View style={{ opacity: 0.45, gap: 12 }}>
        {[['Glow Lab · 60s serum review', 'EGP 2,500–4,000'], ['Bebe Care · baby wash routine', 'EGP 1,800 fixed']].map(([t, p]) => (
          <View key={t} style={styles.lockedRow}>
            <View style={styles.lockedThumb} />
            <View style={{ flex: 1 }}>
              <Text style={[type.label, { color: colors.ink }]}>{t}</Text>
              <Text style={styles.meta}>{p}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...type.label, color: colors.muted },
  meta: { ...type.caption, color: colors.muted },
  statusCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  kicker: { fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.6, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  statusBody: { ...type.body, color: 'rgba(255,255,255,0.85)', marginBottom: spacing.md },
  progressRow: { flexDirection: 'row', gap: 6 },
  progressSeg: { flex: 1, height: 4, borderRadius: radius.pill, backgroundColor: colors.onPrimary },
  progressLabel: { ...type.caption, color: 'rgba(255,255,255,0.75)', marginTop: 10 },
  checklist: { borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.md, marginBottom: spacing.xl },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderColor: colors.hairline },
  checkDone: { width: 20, height: 20, borderRadius: radius.full, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: colors.onPrimary, fontSize: 11 },
  checkText: { flex: 1, ...type.body, color: colors.ink },
  checkTodo: { width: 20, height: 20, borderRadius: radius.full, borderWidth: 1, borderColor: colors.inputBorder },
  checkTextTodo: { ...type.label, color: colors.ink },
  cta: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  ctaText: { ...type.label, color: colors.onPrimary },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.md, padding: 16 },
  lockedThumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.peach },
});

```
