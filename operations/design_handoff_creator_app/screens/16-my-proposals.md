# My Proposals (2c)

Application history with status pills (Pending/Accepted/Declined) and filter chips.

```jsx
import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

const PROPOSALS = [
  { title: 'Tarek Coffee · unboxing', meta: 'You offered EGP 2,600 · sent 1d ago', status: 'Pending', swatch: colors.mint },
  { title: 'Nefer Skin · testimonial', meta: 'You offered EGP 2,800 · sent 3d ago', status: 'Accepted', swatch: colors.yellow },
  { title: 'Hawwa Hair · routine', meta: 'You offered EGP 3,500 · sent 6d ago', status: 'Declined', swatch: colors.surfaceStrong, faded: true },
];

const STATUS_STYLE = {
  Pending: { bg: colors.surfaceStrong, color: colors.body },
  Accepted: { bg: colors.mint, color: colors.forest },
  Declined: { bg: colors.dangerSurface, color: colors.danger },
};

export default function MyProposalsScreen() {
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? PROPOSALS : PROPOSALS.filter((p) => p.status === filter);
  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
      data={filtered}
      keyExtractor={(p) => p.title}
      ListHeaderComponent={
        <View>
          <Text style={[type.displayMd, { color: colors.ink, marginVertical: spacing.md }]}>My proposals</Text>
          <View style={styles.chipRow}>
            {['All', 'Pending', 'Accepted', 'Declined'].map((f) => (
              <Pressable key={f} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipActive]}>
                <Text style={[styles.chipText, filter === f && styles.chipActiveText]}>{f}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      renderItem={({ item }) => {
        const s = STATUS_STYLE[item.status];
        return (
          <View style={[styles.row, item.faded && { opacity: 0.6 }]}>
            <View style={[styles.thumb, { backgroundColor: item.swatch }]} />
            <View style={{ flex: 1 }}>
              <Text style={[type.label, { color: colors.ink }]}>{item.title}</Text>
              <Text style={styles.meta}>{item.meta}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
              <Text style={[styles.statusText, { color: s.color }]}>{item.status}</Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...type.caption, color: colors.body },
  chipActiveText: { color: colors.onPrimary, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.md, padding: spacing.md },
  thumb: { width: 52, height: 52, borderRadius: radius.md },
  meta: { ...type.caption, color: colors.muted },
  statusPill: { borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 11 },
  statusText: { ...type.caption, fontWeight: '500' },
});

```
