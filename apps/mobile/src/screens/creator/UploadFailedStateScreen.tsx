import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { AppText } from '../../components/ui/Text';
import { colors, spacing, radius } from '../../theme/tokens';

export function UploadFailedStateScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <AppText
          style={{ fontSize: 24, color: colors.ink, padding: spacing.xs, marginStart: -spacing.xs }}
        >
          ‹
        </AppText>
        <AppText variant="label" color="ink">
          Upload deliverable
        </AppText>
      </View>
      <View style={styles.errorBanner}>
        <View style={styles.errorDot} />
        <AppText style={styles.body}>
          Upload failed — the connection dropped at 42%. Your file wasn't lost; tap retry to pick up
          where it left off.
        </AppText>
      </View>
      <View style={styles.fileRow}>
        <View style={styles.thumb} />
        <View style={{ flex: 1 }}>
          <AppText variant="label" color="ink">
            glowlab-review-v2.mp4
          </AppText>
          <AppText style={styles.meta}>62s · 184 MB</AppText>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '42%' }]} />
          </View>
          <AppText style={[styles.meta, { color: colors.danger }]}>Failed at 42%</AppText>
        </View>
      </View>
      <Pressable style={styles.cta}>
        <AppText variant="label" color="onPrimary">
          Retry upload
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  errorBanner: {
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.lg,
  },
  errorDot: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    marginTop: 3,
  },
  body: { fontSize: 14, color: colors.body, flex: 1 },
  fileRow: { flexDirection: 'row', gap: 14, marginBottom: spacing.lg },
  thumb: { width: 96, height: 150, borderRadius: radius.md, backgroundColor: colors.surfaceStrong },
  meta: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceStrong,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: 6, backgroundColor: colors.danger },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
});
