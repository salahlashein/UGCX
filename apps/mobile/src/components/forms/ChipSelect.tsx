import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from '../ui/Text';
import { Icon } from '../ui/Icon';

interface Option {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  options: Option[];
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  error?: string;
}

/**
 * TASK-P1-018: a dependency-free enum picker (niches, video type, language,
 * ...). Chips are `radius.full` (DES-P1-010) — the one place besides
 * StatusBadge that pill shape is allowed. EDGE-P1-005: rows wrap, they
 * never scroll horizontally.
 */
export function ChipSelect({ label, options, value, onChange, multiple, error }: Props) {
  const selected = new Set(Array.isArray(value) ? value : value ? [value] : []);

  const toggle = (optionValue: string) => {
    if (multiple) {
      const next = new Set(selected);
      if (next.has(optionValue)) next.delete(optionValue);
      else next.add(optionValue);
      onChange(Array.from(next));
    } else {
      onChange(optionValue);
    }
  };

  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="caption" color="body" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View style={styles.row}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={selected.has(option.value)}
            showCheck={Boolean(multiple)}
            onPress={() => toggle(option.value)}
          />
        ))}
      </View>
      {error ? (
        <AppText variant="bodySm" color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  showCheck: boolean;
  onPress: () => void;
}

function Chip({ label, selected, showCheck, onPress }: ChipProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      hitSlop={{ top: 4, bottom: 4 }}
      pressRetentionOffset={16}
    >
      <Animated.View
        style={[
          chipBaseStyle,
          styles.chip,
          selected ? styles.chipSelected : styles.chipUnselected,
          pressed && chipPressedStyle,
        ]}
      >
        {selected && showCheck ? <Icon name="check" size={14} color="onPrimary" /> : null}
        <AppText variant="caption" color={selected ? 'onPrimary' : 'body'}>
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

// Kept outside StyleSheet.create: `transitionProperty`/`transitionDuration`/
// `transitionTimingFunction` are Reanimated 4 CSS-transition style keys, not
// part of RN's own `ViewStyle`, which `StyleSheet.create` types strictly.
const chipBaseStyle = {
  transform: [{ scale: 1 }],
  transitionProperty: 'transform',
  transitionDuration: '120ms',
  transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
};

const chipPressedStyle = { transform: [{ scale: 0.97 }] };

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { marginBottom: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipUnselected: { backgroundColor: colors.surface, borderColor: colors.inputBorder },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  error: { marginTop: spacing.xxs },
});
