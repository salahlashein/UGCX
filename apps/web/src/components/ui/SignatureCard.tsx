'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';

export type SignatureVariant =
  'dark' | 'hero' | 'coral' | 'forest' | 'cream' | 'peach' | 'mint' | 'yellow' | 'mustard';

export interface SignatureCardProps {
  children: React.ReactNode;
  variant?: SignatureVariant;
  elevation?: string;
  className?: string;
  style?: React.CSSProperties;
}

const VARIANT_BG: Record<Exclude<SignatureVariant, 'hero'>, string> = {
  dark: colors.surfaceDark,
  coral: colors.signatureCoral,
  forest: colors.signatureForest,
  cream: colors.signatureCream,
  peach: colors.signaturePeach,
  mint: colors.signatureMint,
  yellow: colors.signatureYellow,
  mustard: colors.signatureMustard,
};

export function SignatureCard({
  children,
  variant = 'dark',
  className = '',
  style,
}: SignatureCardProps) {
  const isHero = variant === 'hero';

  return (
    <div
      className={className}
      style={{
        background: isHero ? 'var(--paper)' : VARIANT_BG[variant],
        color: isHero ? colors.onDark : undefined,
        borderRadius: isHero ? `${radius.hero}px` : `${radius.xxl}px`,
        padding: `${spacing.lg}px`,
        boxShadow: elevation.soft,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
