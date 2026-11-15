import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppText } from './ui/Text';
import { useIsOnline } from '../hooks/useIsOnline';
import { colors, spacing } from '../theme/tokens';

/**
 * TASK-P4-09: OfflineBanner.
 * Renders a full-width View when the device loses network connectivity.
 * Placed in App.tsx above the navigator.
 * Token: colors.dangerSurface background, colors.danger text.
 */
export function OfflineBanner() {
  const isOnline = useIsOnline();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  if (isOnline) {
    return null;
  }

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[
        styles.banner,
        { paddingTop: Math.max(insets.top, spacing.xs) },
      ]}
    >
      <AppText variant="caption" style={styles.text}>
        {t('common.offline', 'No connection. We will retry when you are back online.')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    backgroundColor: colors.dangerSurface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  text: {
    color: colors.danger,
    textAlign: 'center',
  },
});
