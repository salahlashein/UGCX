# Collaboration Chat (1f)

System-message capsules for escrow/shipment/revision events, distinct from conversational bubbles.

```jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

const MESSAGES = [
  { type: 'system', text: 'Escrow funded · EGP 3,200 held · 28 Aug' },
  { type: 'them', text: 'Welcome Nour! Shipping the serum today. Please film in daylight if you can.' },
  { type: 'me', text: 'Perfect. I shoot mornings, window light in Maadi.' },
  { type: 'system', text: 'Shipment sent · AWB 8842 191 003 · 30 Aug' },
  { type: 'system-highlight', text: 'You confirmed delivery · filming window ends 4 Sep' },
  { type: 'them', text: 'Got it — one thing, please say the price out loud near the end.' },
  { type: 'system', text: 'Deliverable submitted · glowlab-review.mp4' },
  { type: 'system-danger', text: 'Revision 1 requested · see details' },
  { type: 'me', text: 'Re-shooting the middle tonight, v2 tomorrow morning.' },
];

export default function ChatScreen() {
  const [draft, setDraft] = useState('');
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.back}>‹</Text>
        <View style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>Glow Lab</Text>
          <Text style={styles.meta}>Vitamin C serum review</Text>
        </View>
        <View style={styles.statusTag}><Text style={styles.statusTagText}>Funded</Text></View>
      </View>
      <FlatList
        data={MESSAGES}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: spacing.lg, gap: 14 }}
        renderItem={({ item }) => {
          if (item.type.startsWith('system')) {
            const bg = item.type === 'system-highlight' ? colors.cream : item.type === 'system-danger' ? colors.dangerSurface : colors.canvas;
            const color = item.type === 'system-danger' ? colors.danger : colors.muted;
            const border = item.type === 'system' ? { borderWidth: 1, borderColor: colors.hairline } : {};
            return (
              <View style={[styles.systemBubble, { backgroundColor: bg }, border]}>
                <Text style={[styles.systemText, { color }]}>{item.text}</Text>
              </View>
            );
          }
          const mine = item.type === 'me';
          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.text}</Text>
            </View>
          );
        }}
      />
      <View style={styles.inputBar}>
        <View style={styles.attach}><Text style={{ color: colors.muted }}>+</Text></View>
        <TextInput value={draft} onChangeText={setDraft} placeholder="Message Glow Lab" style={styles.input} />
        <Pressable style={styles.sendBtn}><Text style={{ color: colors.onPrimary }}>➤</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.hairline },
  back: { fontSize: 20, color: colors.ink },
  avatar: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.cream },
  brand: { ...type.label, color: colors.ink },
  meta: { ...type.caption, color: colors.muted },
  statusTag: { backgroundColor: colors.yellow, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 11 },
  statusTagText: { ...type.caption, fontWeight: '500', color: colors.ink },
  systemBubble: { alignSelf: 'center', borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 14 },
  systemText: { ...type.caption },
  bubble: { maxWidth: '75%', borderRadius: radius.md, padding: 12 },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.hairline },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleTextTheirs: { ...type.body, color: colors.body },
  bubbleTextMine: { ...type.body, color: colors.onPrimary },
  inputBar: { flexDirection: 'row', gap: 10, alignItems: 'center', borderTopWidth: 1, borderColor: colors.hairline, padding: spacing.md, paddingBottom: 30 },
  attach: { width: 40, height: 40, borderRadius: radius.full, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, height: 44, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: 14, ...type.body },
  sendBtn: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});

```
