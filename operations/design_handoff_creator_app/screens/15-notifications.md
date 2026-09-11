# Notifications (2b)

Grouped by day; unread marked with a leading dot, not a badge.

```jsx
import React from 'react';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

const SECTIONS = [
  { title: 'TODAY', data: [
    { text: 'Kanz Modest sent a message', meta: '"Any update on the reshoot?" · 2h ago', unread: true },
    { text: 'Glow Lab requested a revision', meta: 'Collaboration #1042 · 5h ago', unread: true },
  ]},
  { title: 'YESTERDAY', data: [
    { text: 'EGP 2,800 released — Nefer Skin', meta: 'Now ready to withdraw' },
    { text: 'Your payout was sent', meta: 'EGP 5,100 via InstaPay · ref PO-2291' },
    { text: "You're vetted — welcome!", meta: 'You can now apply to any open brief' },
  ]},
];

export default function NotificationsScreen() {
  return (
    <SectionList
      style={styles.screen}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
      sections={SECTIONS}
      keyExtractor={(item, i) => item.text + i}
      renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={[styles.dot, { opacity: item.unread ? 1 : 0 }]} />
          <View style={{ flex: 1 }}>
            <Text style={[type.label, { color: colors.ink }]}>{item.text}</Text>
            <Text style={styles.meta}>{item.meta}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  sectionHeader: { fontFamily: 'monospace', fontSize: 13, letterSpacing: 0.4, color: colors.muted, marginVertical: 12 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.hairline },
  dot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.coral, marginTop: 6 },
  meta: { ...type.caption, color: colors.muted },
});

```
