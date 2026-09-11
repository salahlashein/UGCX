import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { AppText } from '../../components/ui/Text';
import { colors, spacing, radius } from '../../theme/tokens';

export function NoOpenBriefsStateScreen() {
  return (
    <View style={styles.screen}>
      <AppText
        variant="displayMd"
        color="ink"
        style={{ marginBottom: spacing.lg, marginTop: spacing.md }}
      >
        Discover
      </AppText>
      <View style={styles.center}>
        <View style={styles.placeholder} />
        <AppText variant="label" style={styles.title}>
          No open briefs in Beauty right now
        </AppText>
        <AppText style={styles.body}>
          New briefs get posted daily. We'll notify you the moment one matches.
        </AppText>
        <Pressable style={styles.secondaryBtn}>
          <AppText variant="label" style={styles.secondaryBtnText}>
            Browse other niches
          </AppText>
        </Pressable>
      </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  placeholder: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: spacing.lg,
  },
  title: { fontSize: 17, color: colors.ink, marginBottom: 8, textAlign: 'center' },
  body: { fontSize: 14, color: colors.muted, marginBottom: spacing.lg, textAlign: 'center' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  secondaryBtnText: { fontSize: 15, color: colors.ink },
});
