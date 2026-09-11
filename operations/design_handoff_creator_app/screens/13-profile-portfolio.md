# Profile / Portfolio (1h)

Trust stats (no follower counts) + portfolio grid.

```jsx
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>NH</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={[type.displayMd, { color: colors.ink }]}>Nour Hassan</Text>
          <Text style={styles.meta}>Cairo · filming since 2024</Text>
        </View>
        <Pressable style={styles.editBtn}><Text style={styles.editBtnText}>Edit</Text></Pressable>
      </View>
      <View style={styles.vettedBadge}><Text style={styles.vettedText}>Vetted creator · Aug 2026</Text></View>
      <View style={styles.chipRow}>
        {['Beauty', 'Skincare', 'Mom & baby', 'Talking head'].map((n) => (
          <View key={n} style={styles.chip}><Text style={styles.chipText}>{n}</Text></View>
        ))}
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCell}><Text style={styles.statValue}>14</Text><Text style={styles.statLabel}>Collaborations</Text></View>
        <View style={[styles.statCell, styles.statBorder]}><Text style={styles.statValue}>96%</Text><Text style={styles.statLabel}>Approved</Text></View>
        <View style={styles.statCell}><Text style={styles.statValue}>1.2</Text><Text style={styles.statLabel}>Revisions avg</Text></View>
      </View>
      <View style={styles.sectionHeader}>
        <Text style={[type.titleLg, { color: colors.ink }]}>Portfolio</Text>
        <Text style={{ color: colors.link, ...type.caption }}>Add video</Text>
      </View>
      <View style={styles.grid}>
        {[colors.peach, colors.mint, colors.yellow, colors.mustard].map((c, i) => (
          <View key={i} style={[styles.tile, { backgroundColor: c }]} />
        ))}
      </View>
      {[['Base price', 'EGP 2,800'], ['Payout details', 'InstaPay · verified'], ['App language', 'العربية']].map(([k, v]) => (
        <View key={k} style={styles.infoRow}>
          <Text style={styles.infoKey}>{k}</Text>
          <Text style={styles.infoVal}>{v}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginTop: spacing.md, marginBottom: spacing.lg },
  avatar: { width: 72, height: 72, borderRadius: radius.full, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, color: colors.forest },
  meta: { ...type.body, color: colors.muted },
  editBtn: { borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.lg, paddingVertical: 10, paddingHorizontal: 14 },
  editBtnText: { ...type.label, fontSize: 13, color: colors.ink },
  vettedBadge: { alignSelf: 'flex-start', backgroundColor: colors.forest, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 12, marginBottom: spacing.lg },
  vettedText: { ...type.caption, fontWeight: '500', color: colors.onPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  chip: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 13 },
  chipText: { ...type.caption, color: colors.body },
  statsRow: { flexDirection: 'row', borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.md, marginBottom: spacing.xl },
  statCell: { flex: 1, padding: spacing.md },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.hairline },
  statValue: { ...type.titleLg, color: colors.ink },
  statLabel: { ...type.caption, color: colors.muted },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.lg },
  tile: { width: '47%', height: 196, borderRadius: radius.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.hairline },
  infoKey: { ...type.body, color: colors.muted },
  infoVal: { ...type.label, color: colors.ink },
});

```
