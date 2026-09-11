# Brief Detail → Apply Sheet (1d)

Brief detail with sticky CTA bar, plus the apply bottom sheet (price stepper + delivery segmented control + escrow disclosure).

```jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

export function BriefDetailScreen({ onApply }) {
  return (
    <View style={styles.screen}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.hero} />
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <View style={styles.brandRow}>
            <View style={styles.brandAvatar} />
            <Text style={styles.brandName}>Glow Lab</Text>
            <View style={styles.statusTag}><Text style={styles.statusTagText}>Open · 4 proposals</Text></View>
          </View>
          <Text style={[type.displayMd, styles.title]}>Honest 60s review of our Vitamin C serum</Text>
          <Text style={styles.body}>We want a real morning-routine feel, filmed at home, Egyptian Arabic, no studio lighting. Show the texture on skin and say the price out loud.</Text>
          {[['Video type', 'Talking head'], ['Duration', '60 seconds'], ['Language', 'Egyptian Arabic'], ['Script', 'Brand-provided'], ['Shipping', 'Product sent to you']].map(([k, v]) => (
            <View key={k} style={styles.specRow}>
              <Text style={styles.specKey}>{k}</Text>
              <Text style={styles.specVal}>{v}</Text>
            </View>
          ))}
          <View style={styles.creamCard}>
            <Text style={styles.creamTitle}>Three things to hit</Text>
            <Text style={styles.body}>01  Fast absorption, no sticky finish{'\n'}02  Made in Egypt, dermatologist tested{'\n'}03  Say "EGP 349" clearly</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.stickyBar}>
        <View style={styles.stickyRow}>
          <View>
            <Text style={styles.priceRange}>EGP 2,500–4,000</Text>
            <Text style={styles.priceLabel}>Brand's stated range</Text>
          </View>
          <Text style={styles.closesIn}>Closes in 4 days</Text>
        </View>
        <Pressable style={styles.cta} onPress={onApply}>
          <Text style={styles.ctaText}>Apply — set your price</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ApplySheet({ visible, onClose, onSend }) {
  const [price, setPrice] = useState('3200');
  const [days, setDays] = useState(5);
  const [note, setNote] = useState("I've shot 4 skincare reviews this month. I can film with morning window light in Maadi.");
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <Text style={[type.displayMd, { color: colors.ink }]}>Your proposal</Text>
        <Text style={[styles.priceLabel, { marginBottom: spacing.lg }]}>Glow Lab · 60s talking head</Text>
        <Text style={styles.label}>Your price</Text>
        <View style={styles.priceInputRow}>
          <Text style={styles.currency}>EGP</Text>
          <TextInput value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.priceInputField} />
        </View>
        <View style={styles.presetRow}>
          {['2500', '3200', '4000'].map((p) => (
            <Pressable key={p} onPress={() => setPrice(p)} style={[styles.preset, price === p && styles.presetActive]}>
              <Text style={[styles.presetText, price === p && styles.presetTextActive]}>{p}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Delivery time</Text>
        <View style={styles.segmented}>
          {[3, 5, 7].map((d) => (
            <Pressable key={d} onPress={() => setDays(d)} style={[styles.segment, days === d && styles.segmentActive]}>
              <Text style={[styles.segmentText, days === d && styles.segmentTextActive]}>{d} days</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Note to the brand</Text>
        <TextInput value={note} onChangeText={setNote} multiline style={styles.noteInput} />
        <View style={styles.escrowNote}>
          <View style={styles.escrowDot} />
          <Text style={styles.escrowText}>The brand pays into escrow the moment they accept. Your EGP {price} is held by UGCX and released when they approve the video.</Text>
        </View>
        <Pressable style={styles.cta} onPress={() => onSend({ price, days, note })}>
          <Text style={styles.ctaText}>Send proposal</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  hero: { height: 236, backgroundColor: colors.peach },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  brandAvatar: { width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.cream },
  brandName: { ...type.body, color: colors.body },
  statusTag: { backgroundColor: colors.mint, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 9 },
  statusTagText: { ...type.caption, fontWeight: '500', color: colors.forest },
  title: { color: colors.ink, marginBottom: 12 },
  body: { ...type.body, color: colors.body, marginBottom: spacing.lg },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.hairline },
  specKey: { ...type.body, color: colors.muted },
  specVal: { ...type.label, color: colors.ink },
  creamCard: { backgroundColor: colors.cream, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.lg },
  creamTitle: { ...type.label, color: colors.ink, marginBottom: 10 },
  stickyBar: { borderTopWidth: 1, borderColor: colors.hairline, backgroundColor: colors.canvas, padding: spacing.lg, paddingBottom: 30 },
  stickyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  priceRange: { ...type.label, color: colors.ink },
  priceLabel: { ...type.caption, color: colors.muted },
  closesIn: { ...type.caption, color: colors.muted },
  cta: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  ctaText: { ...type.label, color: colors.onPrimary },
  scrim: { flex: 1, backgroundColor: 'rgba(24,29,38,0.45)' },
  sheet: { backgroundColor: colors.canvas, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, paddingBottom: 30 },
  grabber: { width: 44, height: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceStrong, alignSelf: 'center', marginBottom: spacing.lg },
  label: { ...type.label, color: colors.ink, marginBottom: 8, marginTop: spacing.sm },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: 14, marginBottom: 10 },
  currency: { ...type.body, color: colors.muted },
  priceInputField: { flex: 1, ...type.titleMd, color: colors.ink },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  preset: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 14 },
  presetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetText: { ...type.caption, color: colors.body },
  presetTextActive: { color: colors.onPrimary, fontWeight: '500' },
  segmented: { flexDirection: 'row', borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, overflow: 'hidden', marginBottom: spacing.lg },
  segment: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRightWidth: 1, borderColor: colors.inputBorder },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { ...type.body, color: colors.body },
  segmentTextActive: { color: colors.onPrimary, fontWeight: '500' },
  noteInput: { minHeight: 76, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, padding: 12, ...type.body, color: colors.body, marginBottom: spacing.md, textAlignVertical: 'top' },
  escrowNote: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  escrowDot: { width: 16, height: 16, borderRadius: radius.full, backgroundColor: colors.success, marginTop: 3 },
  escrowText: { flex: 1, ...type.caption, color: colors.muted },
});

```
