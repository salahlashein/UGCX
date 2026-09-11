import React from 'react';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from './Text';

interface Props extends TouchableOpacityProps {
  label: string;
  selected: boolean;
}

export function FilterChip({ label, selected, style, ...rest }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected, style]}
      {...rest}
    >
      <AppText variant="label" color={selected ? 'onPrimary' : 'ink'}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipUnselected: {
    backgroundColor: colors.canvas,
    borderColor: colors.inputBorder,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
