import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppText } from '../components/ui/Text';
import { colors, radius, spacing } from '../theme/tokens';
import { elevation } from '../theme/elevation';

/**
 * 2026-10-03: floating dark pill tab bar (brand redesign, C3 sage).
 * It sits in the layout flow, not over the content, so no screen needs
 * extra bottom padding. Only the focused tab shows its label.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.bar} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              aria-selected={focused}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.item,
                focused && styles.itemFocused,
                pressed && styles.itemPressed,
              ]}
            >
              {options.tabBarIcon?.({ focused, color: '', size: 20 })}
              {focused && (
                <AppText variant="bodySm" color="ink" numberOfLines={1}>
                  {label}
                </AppText>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.pill,
    padding: 6,
    ...elevation.soft,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth: 48,
    height: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  itemFocused: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
  },
  itemPressed: {
    opacity: 0.7,
  },
});
