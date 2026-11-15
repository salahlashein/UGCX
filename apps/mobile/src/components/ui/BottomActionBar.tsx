import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, sizes, spacing } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';

interface Props {
  children: ReactNode;
}

/** TASK-P1-025: replaces the ad-hoc `navRow` pattern repeated across the wizard and detail screens. */
export function BottomActionBar({ children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, elevation.raised, { paddingBottom: spacing.md + insets.bottom }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: sizes.hairlineWidth,
    borderTopColor: colors.hairline,
    padding: spacing.md,
  },
});
