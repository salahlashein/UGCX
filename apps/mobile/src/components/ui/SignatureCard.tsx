import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';

interface Props extends ViewProps {
  variant: 'coral' | 'forest' | 'dark' | 'cream';
  children: React.ReactNode;
}

export function SignatureCard({ variant, children, style, ...rest }: Props) {
  return (
    <View style={[styles.card, styles[variant], style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xxl, // 48px padding per DESIGN.md for full-bleed signature cards
  },
  coral: {
    backgroundColor: colors.signatureCoral,
  },
  forest: {
    backgroundColor: colors.signatureForest,
  },
  dark: {
    backgroundColor: colors.surfaceDark,
  },
  cream: {
    backgroundColor: colors.signatureCream,
  },
});
