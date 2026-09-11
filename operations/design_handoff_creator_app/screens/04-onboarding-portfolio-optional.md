# Onboarding — Optional Portfolio

Screen 2a (step 4). Fully skippable — resumable later from Profile or the pending-vetting home.

```jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

export default function OptionalPortfolioScreen({ onSubmit, onSkip }) {
  const [price, setPrice] = useState('');
  const [handle, setHandle] = useState('');
  const [samples, setSamples] = useState([]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.stepLabel}>STEP 2 OF 2 · OPTIONAL</Text>
          <Pressable onPress={onSkip}><Text style={styles.skip}>Skip for now</Text></Pressable>
        </View>
        <Text style={[type.displayMd, styles.heading]}>Build your portfolio</Text>
        <Text style={styles.sub}>Adding samples now speeds up vetting — you can also do this after you're approved.</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.lg }}>
        <View style={styles.grid}>
          <Pressable style={styles.addTile} onPress={() => setSamples([...samples, 'clip'])}>
            <Text style={styles.dropzoneText}>+ Add video</Text>
          </Pressable>
          {samples.map((_, i) => <View key={i} style={styles.sampleTile} />)}
        </View>
        <Text style={styles.label}>Base price — optional, editable anytime</Text>
        <View style={styles.priceRow}>
          <Text style={styles.currency}>EGP</Text>
          <TextInput value={price} onChangeText={setPrice} placeholder="e.g. 2,500" keyboardType="numeric" style={styles.priceInput} />
        </View>
        <Text style={styles.label}>Instagram or TikTok — optional</Text>
        <TextInput value={handle} onChangeText={setHandle} placeholder="@yourhandle" style={styles.input} />
      </ScrollView>
      <Pressable style={styles.cta} onPress={onSubmit}>
        <Text style={styles.ctaText}>Submit for review</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg, paddingTop: 56 },
  header: { marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  stepLabel: { fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.5, color: colors.muted },
  skip: { ...type.label, fontSize: 13, color: colors.link },
  heading: { color: colors.ink, marginBottom: 6 },
  sub: { ...type.body, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: spacing.md, marginBottom: spacing.lg },
  addTile: { width: '47%', height: 150, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.inputBorder, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  sampleTile: { width: '47%', height: 150, borderRadius: radius.md, backgroundColor: colors.peach },
  dropzoneText: { ...type.caption, color: colors.muted },
  label: { ...type.label, color: colors.ink, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', height: 52, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: 14, gap: 10, marginBottom: spacing.md },
  currency: { ...type.body, color: colors.muted },
  priceInput: { flex: 1, ...type.body, color: colors.ink },
  input: { height: 52, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, paddingHorizontal: 14, ...type.body, color: colors.ink },
  cta: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginVertical: spacing.md },
  ctaText: { ...type.label, color: colors.onPrimary },
});

```
