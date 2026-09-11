# Empty & Error States (2e)

No open briefs (empty discovery), and a failed upload with retry.

```jsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

export function NoOpenBriefsState({ onBrowseOthers }) {
  return (
    <View style={styles.screen}>
      <Text style={[type.displayMd, { color: colors.ink, marginBottom: spacing.lg }]}>Discover</Text>
      <View style={styles.center}>
        <View style={styles.placeholder} />
        <Text style={styles.title}>No open briefs in Beauty right now</Text>
        <Text style={styles.body}>New briefs get posted daily. We'll notify you the moment one matches.</Text>
        <Pressable style={styles.secondaryBtn} onPress={onBrowseOthers}>
          <Text style={styles.secondaryBtnText}>Browse other niches</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function UploadFailedState({ onRetry }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={{ fontSize: 20, color: colors.ink }}>‹</Text>
        <Text style={[type.label, { color: colors.ink }]}>Upload deliverable</Text>
      </View>
      <View style={styles.errorBanner}>
        <View style={styles.errorDot} />
        <Text style={styles.body}>Upload failed — the connection dropped at 42%. Your file wasn't lost; tap retry to pick up where it left off.</Text>
      </View>
      <View style={styles.fileRow}>
        <View style={styles.thumb} />
        <View style={{ flex: 1 }}>
          <Text style={[type.label, { color: colors.ink }]}>glowlab-review-v2.mp4</Text>
          <Text style={styles.meta}>62s · 184 MB</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: '42%' }]} /></View>
          <Text style={[styles.meta, { color: colors.danger }]}>Failed at 42%</Text>
        </View>
      </View>
      <Pressable style={styles.cta} onPress={onRetry}><Text style={styles.ctaText}>Retry upload</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  placeholder: { width: 64, height: 64, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline, marginBottom: spacing.lg },
  title: { ...type.label, fontSize: 17, color: colors.ink, marginBottom: 8, textAlign: 'center' },
  body: { ...type.body, fontSize: 14, color: colors.muted, marginBottom: spacing.lg, textAlign: 'center' },
  secondaryBtn: { borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 20 },
  secondaryBtnText: { ...type.label, fontSize: 15, color: colors.ink },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.lg },
  errorBanner: { backgroundColor: colors.dangerSurface, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', gap: 12, marginBottom: spacing.lg },
  errorDot: { width: 16, height: 16, borderRadius: radius.full, backgroundColor: colors.danger, marginTop: 3 },
  fileRow: { flexDirection: 'row', gap: 14, marginBottom: spacing.lg },
  thumb: { width: 96, height: 150, borderRadius: radius.md, backgroundColor: colors.surfaceStrong },
  meta: { ...type.caption, color: colors.muted, marginBottom: 8 },
  progressTrack: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceStrong, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 6, backgroundColor: colors.danger },
  cta: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  ctaText: { ...type.label, color: colors.onPrimary },
});

```
