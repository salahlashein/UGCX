# Home — Status Board (1c)

Escrow summary + horizontal rails per collaboration stage.

```jsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

const RAILS = [
  { title: 'Needs filming', count: 2, cards: [
    { tag: 'Due in 2 days', tagBg: colors.peach, title: 'Glow Lab serum', meta: 'EGP 3,200 held' },
    { tag: 'Shipment sent', tagBg: colors.yellow, title: 'Bebe Care wash', meta: 'EGP 1,800 held' },
  ]},
  { title: 'In review', count: 1, cards: [
    { tag: 'Revision 1', tagBg: colors.dangerSurface, tagColor: colors.danger, title: 'Kanz try-on haul', meta: 'Fix requested 5h ago' },
    { tag: 'Applied', tagBg: colors.surfaceStrong, title: 'Tarek Coffee', meta: '', faded: true },
  ]},
];

export default function StatusBoardScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View style={styles.headerRow}>
        <Text style={[type.displayMd, { color: colors.ink }]}>My board</Text>
        <View style={styles.avatar}><Text style={styles.avatarText}>NH</Text></View>
      </View>
      <View style={styles.escrowCard}>
        <Text style={styles.escrowKicker}>ESCROW</Text>
        <View style={{ flexDirection: 'row', gap: 28 }}>
          <View>
            <Text style={styles.escrowAmount}>EGP 6,400</Text>
            <Text style={styles.escrowLabel}>held for you</Text>
          </View>
          <View>
            <Text style={styles.escrowAmount}>EGP 3,200</Text>
            <Text style={styles.escrowLabel}>ready to withdraw</Text>
          </View>
        </View>
      </View>
      {RAILS.map((rail) => (
        <View key={rail.title} style={{ marginBottom: spacing.lg }}>
          <View style={styles.railHeader}>
            <Text style={styles.railTitle}>{rail.title}</Text>
            <Text style={styles.railCount}>{rail.count}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {rail.cards.map((c, i) => (
              <View key={i} style={[styles.card, c.faded && { opacity: 0.5 }]}>
                <View style={[styles.tag, { backgroundColor: c.tagBg }]}>
                  <Text style={[styles.tagText, c.tagColor && { color: c.tagColor }]}>{c.tag}</Text>
                </View>
                <Text style={styles.cardTitle}>{c.title}</Text>
                {c.meta ? <Text style={styles.cardMeta}>{c.meta}</Text> : null}
              </View>
            ))}
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...type.label, color: colors.forest },
  escrowCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl },
  escrowKicker: { fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.6, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  escrowAmount: { ...type.displayMd, color: colors.onPrimary },
  escrowLabel: { ...type.caption, color: 'rgba(255,255,255,0.75)' },
  railHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 },
  railTitle: { ...type.titleLg, color: colors.ink },
  railCount: { fontFamily: 'monospace', fontSize: 13, color: colors.muted },
  card: { width: 212, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.md, padding: spacing.md, marginRight: spacing.sm },
  tag: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 9, marginBottom: 12 },
  tagText: { ...type.caption, fontWeight: '500', color: colors.ink },
  cardTitle: { ...type.titleLg, color: colors.ink, marginBottom: 8 },
  cardMeta: { ...type.caption, color: colors.muted },
});

```
