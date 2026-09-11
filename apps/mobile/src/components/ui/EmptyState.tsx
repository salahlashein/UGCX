import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useReducedMotion, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { spacing } from '../../theme/tokens';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { AppText } from './Text';
import { Button } from './Button';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

// Custom Reanimated layout-animation builders (module scope, per the
// Reanimated docs — rebuilding one in JSX on every render is wasted work).
function fadeUpEntering() {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 8 }] },
    animations: {
      opacity: withTiming(1, { duration: 250, easing: EASE_OUT }),
      transform: [{ translateY: withTiming(0, { duration: 250, easing: EASE_OUT }) }],
    },
  };
}

// REQ-009 / EDGE-P1-006: reduced motion drops to an opacity-only change.
function fadeOnlyEntering() {
  'worklet';
  return {
    initialValues: { opacity: 0 },
    animations: { opacity: withTiming(1, { duration: 250, easing: EASE_OUT }) },
  };
}

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface Props {
  icon?: IconName;
  title?: string;
  message?: string;
  action?: EmptyStateAction;
}

/** TASK-P1-019: the only cream surface allowed on a list screen (GUD-001, DES-P1-011). */
export function EmptyState({ icon = 'inbox', title, message, action }: Props) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const entering = reducedMotion ? fadeOnlyEntering : fadeUpEntering;

  return (
    <View style={styles.container}>
      <Animated.View entering={entering} style={styles.animatedWrap}>
        <Card tone="cream" style={styles.card}>
          <Icon name={icon} size={40} color="ink" />
          <AppText variant="titleSm" color="ink" style={styles.title}>
            {title ?? t('common.empty.title')}
          </AppText>
          <AppText variant="body" color="body" style={styles.message}>
            {message ?? t('common.empty.generic')}
          </AppText>
          {action ? (
            <View style={styles.action}>
              <Button title={action.label} onPress={action.onPress} />
            </View>
          ) : null}
        </Card>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  animatedWrap: { alignSelf: 'stretch' },
  card: { alignItems: 'center' },
  title: { marginTop: spacing.sm, textAlign: 'center' },
  message: { marginTop: spacing.xxs, textAlign: 'center' },
  action: { marginTop: spacing.md, alignSelf: 'stretch' },
});
