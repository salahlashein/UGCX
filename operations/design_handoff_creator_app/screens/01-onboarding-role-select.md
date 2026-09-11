# Onboarding — Role Select

Screen 2a (step 1). Full-height centered per the mobile addendum exception.

```jsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

export default function RoleSelectScreen({ onContinue }) {
  const [role, setRole] = useState('creator');
  const Option = ({ id, title, subtitle, swatch }) => (
    <Pressable
      onPress={() => setRole(id)}
      style={[styles.option, role === id && styles.optionSelected]}
    >
      <View style={[styles.avatar, { backgroundColor: swatch }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.radio, role === id && styles.radioSelected]} />
    </Pressable>
  );
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.logo} />
        <Text style={[type.displayLg, styles.heading]}>Who are you on UGCX?</Text>
        <Text style={styles.sub}>You can't switch roles later in Phase 1 — pick the one that fits.</Text>
        <Option id="creator" title="I'm a creator" subtitle="Apply to briefs, film, get paid" swatch={colors.mint} />
        <Option id="brand" title="I'm a brand" subtitle="Post briefs, buy video content" swatch={colors.cream} />
      </View>
      <Pressable style={styles.cta} onPress={() => onContinue(role)}>
        <Text style={styles.ctaText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg, paddingTop: 96, paddingBottom: spacing.xl },
  content: { flex: 1, justifyContent: 'center' },
  logo: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.primary, marginBottom: spacing.lg },
  heading: { color: colors.ink, marginBottom: spacing.xs },
  sub: { ...type.body, color: colors.muted, marginBottom: spacing.xl },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm },
  optionSelected: { borderWidth: 2, borderColor: colors.primary },
  avatar: { width: 44, height: 44, borderRadius: radius.full },
  optionTitle: { ...type.label, color: colors.ink },
  optionSubtitle: { ...type.caption, color: colors.muted },
  radio: { width: 20, height: 20, borderRadius: radius.full, borderWidth: 1, borderColor: colors.inputBorder },
  radioSelected: { borderWidth: 6, borderColor: colors.primary },
  cta: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  ctaText: { ...type.label, color: colors.onPrimary },
});

```
