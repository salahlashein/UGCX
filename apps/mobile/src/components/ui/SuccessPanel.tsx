import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { spacing } from '../../theme/tokens';
import { Card, cardTextColor } from './Card';
import { Icon } from './Icon';
import { AppText } from './Text';
import { Button } from './Button';

interface SuccessPanelAction {
  label: string;
  onPress: () => void;
}

interface Props {
  title: string;
  message?: string;
  action?: SuccessPanelAction;
}

/**
 * TASK-P1-026: the one voltage component (REQ-011). Used by exactly four
 * screens (Waves 5-6): AcceptProposal (funded), DeliverableUpload
 * (uploaded), CampaignDetailApply (applied), PayoutDetails (saved).
 */
export function SuccessPanel({ title, message, action }: Props) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const hapticFired = useRef(false);
  const textColor = cardTextColor('forest');

  useEffect(() => {
    // EDGE-P1-006: reduced motion still fires the haptic — haptics are
    // feedback, not motion. Guarded so a re-render cannot double-fire it.
    if (!hapticFired.current) {
      hapticFired.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    progress.set(
      reducedMotion
        ? withTiming(1, { duration: 250 })
        : withSpring(1, { duration: 400, dampingRatio: 0.8 }),
    );
    // Mount-only: this is an entrance, it must not re-fire on prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    // Never `scale(0)` — starts at 0.96. Reduced motion holds scale at 1
    // and animates opacity only.
    transform: [{ scale: reducedMotion ? 1 : 0.96 + progress.get() * 0.04 }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedWrap, animatedStyle]}>
        <Card tone="forest" style={styles.card}>
          <Icon name="check-circle" size={40} color={textColor} />
          <AppText variant="titleLg" color={textColor} style={styles.title}>
            {title}
          </AppText>
          {message ? (
            <AppText variant="body" color={textColor} style={styles.message}>
              {message}
            </AppText>
          ) : null}
          {action ? (
            <View style={styles.action}>
              <Button variant="secondaryOnDark" title={action.label} onPress={action.onPress} />
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
  action: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
