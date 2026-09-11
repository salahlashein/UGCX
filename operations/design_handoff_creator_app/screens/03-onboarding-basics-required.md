# Onboarding — Required Basics

Screen 2a (step 3). Name, city, up to 3 niches, verification clip — all required before submitting for vetting.

```jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

const NICHES = ['Beauty', 'Skincare', 'Mom & baby', 'Food', 'Fashion'];

export default function BasicsScreen({ onContinue }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('Cairo');
  const [niches, setNiches] = useState(['Beauty', 'Skincare']);
  const [clip, setClip] = useState(null);

  const toggleNiche = (n) => {
    setNiches((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : prev.length < 3 ? [...prev, n] : prev
    );
  };

  const canContinue = name.trim().length > 0 && city && niches.length > 0 && clip;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>STEP 1 OF 2 · REQUIRED</Text>
        <Text style={[type.displayMd, styles.heading]}>The basics</Text>
        <Text style={styles.sub}>This is all we need to start reviewing you.</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.lg }}>
        <Text style={styles.label}>Full name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Your name" style={styles.input} />
        <Text style={styles.label}>City</Text>
        <TextInput value={city} onChangeText={setCity} style={styles.input} />
        <Text style={styles.label}>Your niches — pick up to 3</Text>
        <View style={styles.chipRow}>
          {NICHES.map((n) => {
            const selected = niches.includes(n);
            return (
              <Pressable key={n} onPress={() => toggleNiche(n)} style={[styles.chip, selected && styles.chipSelected]}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{n}{selected ? ' ✓' : ''}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.label}>One video of yourself talking</Text>
        <Pressable style={styles.dropzone} onPress={() => setClip('recorded.mp4')}>
          <Text style={styles.dropzoneText}>{clip ? clip : '+ Record or upload a 15s clip'}</Text>
        </Pressable>
        <Text style={styles.hint}>Required so an admin can verify it's really you.</Text>
      </ScrollView>
      <Pressable disabled={!canContinue} style={[styles.cta, !canContinue && styles.ctaDisabled]} onPress={onContinue}>
        <Text style={[styles.ctaText, !canContinue && styles.ctaTextDisabled]}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg, paddingTop: 56 },
  header: { marginBottom: spacing.md },
  stepLabel: { fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.5, color: colors.muted, marginBottom: 10 },
  heading: { color: colors.ink, marginBottom: 6 },
  sub: { ...type.body, color: colors.muted },
  label: { ...type.label, color: colors.ink, marginBottom: 8, marginTop: spacing.md },
  input: { height: 52, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: 14, ...type.body, color: colors.ink },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 14 },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...type.caption, color: colors.body },
  chipTextSelected: { color: colors.onPrimary, fontWeight: '500' },
  dropzone: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.inputBorder, borderRadius: radius.md, padding: 20, alignItems: 'center' },
  dropzoneText: { ...type.body, color: colors.muted },
  hint: { ...type.caption, color: colors.muted, marginTop: 8 },
  cta: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginVertical: spacing.md },
  ctaDisabled: { backgroundColor: colors.surfaceStrong },
  ctaText: { ...type.label, color: colors.onPrimary },
  ctaTextDisabled: { color: colors.borderStrong },
});

```
