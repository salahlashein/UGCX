import { ActivityIndicator, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';

/**
 * TASK-P1-021 / EDGE-P1-001: rendered while fonts are still loading, so
 * this must not import `AppText` (which resolves a font family) or depend
 * on any font having resolved. Raw RN `Text` with no `fontFamily` falls
 * back to the platform default, matching EDGE-P1-002.
 */
export function LoadingState() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>{t('common.loading')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.canvas,
  },
  text: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    fontWeight: String(typography.caption.weight) as TextStyle['fontWeight'],
  },
});
