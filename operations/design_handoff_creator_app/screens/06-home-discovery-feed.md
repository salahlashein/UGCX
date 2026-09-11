# Home — Discovery Feed (1b)

Briefs are the product. FlatList of uneven-height cards, filter chips, one thin work-in-progress strip.

```jsx
import React from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

const BRIEFS = [
  { id: '1', brand: 'Glow Lab', title: 'Honest 60s review of our Vitamin C serum', price: 'EGP 2,500–4,000', meta: '60s · talking head · ships to you', status: 'Open · 4 proposals', swatch: colors.peach, big: true },
  { id: '2', brand: 'Bebe Care', title: 'Baby wash routine, no face needed', price: 'EGP 1,800 · 45s · fixed price', swatch: colors.yellow },
  { id: '3', brand: 'Kanz Modest', title: 'Try-on haul, 3 pieces', swatch: colors.mint },
];

export default function DiscoveryFeedScreen({ onOpenBrief }) {
  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
      data={BRIEFS}
      keyExtractor={(b) => b.id}
      ListHeaderComponent={
        <View>
          <View style={styles.searchRow}>
            <TextInput placeholder="Search briefs, brands, niches" style={styles.search} />
            <View style={styles.langBtn}><Text style={styles.langBtnText}>AR</Text></View>
          </View>
          <View style={styles.chipRow}>
            <View style={[styles.chip, styles.chipActive]}><Text style={styles.chipActiveText}>Beauty</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>Cairo</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>No shipping</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>2,000+</Text></View>
          </View>
          <Pressable style={styles.wipStrip}>
            <Text style={styles.wipText}>1 upload due in 2 days · EGP 3,200 held</Text>
          </Pressable>
          <Text style={[type.titleLg, styles.count]}>12 open briefs</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => onOpenBrief(item.id)}>
          <View style={[styles.thumb, { backgroundColor: item.swatch, height: item.big ? 132 : 64 }]} />
          <Text style={styles.brand}>{item.brand}{item.status ? ' · ' + item.status : ''}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.price}>{item.price}</Text>
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  searchRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.sm },
  search: { flex: 1, height: 44, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: 14, ...type.body },
  langBtn: { width: 44, height: 44, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  langBtnText: { fontFamily: 'monospace', fontSize: 12, color: colors.muted },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...type.caption, color: colors.body },
  chipActiveText: { ...type.caption, fontWeight: '500', color: colors.onPrimary },
  wipStrip: { backgroundColor: colors.cream, borderRadius: radius.md, padding: 14, marginBottom: spacing.lg },
  wipText: { ...type.body, color: colors.ink },
  count: { color: colors.ink, marginBottom: 14 },
  card: { borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.md, padding: spacing.md },
  thumb: { borderRadius: radius.md, marginBottom: spacing.md },
  brand: { ...type.caption, color: colors.muted, marginBottom: 4 },
  title: { ...type.titleLg, color: colors.ink, marginBottom: 8 },
  price: { ...type.label, color: colors.ink },
});

```
