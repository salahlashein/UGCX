import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/tokens';

interface Props {
  children: ReactNode;
  edges?: Edge[];
  scroll?: boolean;
  footer?: ReactNode;
}

/**
 * TASK-P1-011: replaces the SafeAreaView + ScrollView pair repeated across
 * 14 screens. Not wired into any screen in this wave (Wave 1+ consumes it).
 * `footer` renders as-is here; BottomActionBar (TASK-P1-025) does not exist
 * until Wave 1, which wraps this slot in it.
 */
export function Screen({ children, edges = ['bottom'], scroll = false, footer }: Props) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.container} edges={edges}>
      {content}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { flex: 1, padding: spacing.lg },
  scrollContent: { padding: spacing.lg },
});
