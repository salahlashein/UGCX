import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from './Text';

interface Props extends ViewProps {
  message: string;
}

export function SystemMessageCapsule({ message, style, ...rest }: Props) {
  return (
    <View style={[styles.capsule, style]} {...rest}>
      <AppText variant="caption" color="muted">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  capsule: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
});
