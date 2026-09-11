import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme/tokens';
import { AppText } from './Text';

interface Props {
  title: string;
  caption?: string;
  action?: ReactNode;
}

/** TASK-P1-024: `row` + `space-between` auto-mirrors under RTL — no manual direction handling needed. */
export function SectionHeader({ title, caption, action }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textCol}>
        <AppText variant="titleLg" color="ink" accessibilityRole="header">
          {title}
        </AppText>
        {caption ? (
          <AppText variant="caption" color="muted" style={styles.caption}>
            {caption}
          </AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  textCol: { flex: 1 },
  caption: { marginTop: spacing.xxs },
});
