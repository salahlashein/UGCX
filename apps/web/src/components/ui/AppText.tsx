'use client';

import React from 'react';
import { colors, type ColorToken } from '../../theme/tokens';
import { typography, type TypographyRole } from '../../theme/typography';
import { useTranslation } from '../../i18n';

export type LegacyVariant = 'h1' | 'h2' | 'h3' | 'subtitle' | 'bodySmall' | 'mono' | 'dataMonoCaps';

const VARIANT_MAP: Record<LegacyVariant, TypographyRole> = {
  h1: 'displayLg',
  h2: 'displayMd',
  h3: 'titleLg',
  subtitle: 'titleSm',
  bodySmall: 'bodySm',
  mono: 'numeric',
  dataMonoCaps: 'overlineMono',
};

export interface AppTextProps {
  children: React.ReactNode;
  variant?: TypographyRole | LegacyVariant;
  color?: ColorToken | (string & {});
  tone?: ColorToken | (string & {});
  weight?: number;
  tabular?: boolean;
  align?: 'start' | 'center' | 'end';
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div' | 'label';
  className?: string;
  style?: React.CSSProperties;
}

export function AppText({
  children,
  variant = 'body',
  color = 'ink',
  tone,
  weight,
  tabular = false,
  align = 'start',
  as: Component = 'span',
  className = '',
  style,
}: AppTextProps) {
  const { isRTL } = useTranslation();
  const resolvedVariant = (
    variant in VARIANT_MAP ? VARIANT_MAP[variant as LegacyVariant] : variant
  ) as TypographyRole;
  const role = typography[resolvedVariant] ?? typography.body;
  const finalColorKey = tone ?? color;
  const isMono = 'mono' in role && Boolean((role as { mono?: boolean }).mono);
  // A number role only ever holds digits, so it keeps its own order inside a
  // right to left line. Label roles are left alone: they hold Arabic words.
  const isNumberRole = (
    ['metric', 'metricMono', 'metricMd', 'metricSm', 'numeric'] as string[]
  ).includes(resolvedVariant);
  const isCaps =
    resolvedVariant === 'overlineMono' ||
    resolvedVariant === 'badgeMono' ||
    resolvedVariant === 'tableHead';
  const lineHeight = isRTL ? Math.round(role.lineHeight * 1.15) : role.lineHeight;

  const resolvedColor =
    finalColorKey && finalColorKey in colors
      ? colors[finalColorKey as ColorToken]
      : (finalColorKey ?? colors.ink);

  const computedStyle: React.CSSProperties = {
    fontSize: `${role.fontSize}px`,
    lineHeight: `${lineHeight}px`,
    // Arabic letters join. Positive tracking pulls them apart, so drop it in
    // a right to left page. Negative tracking on the big number roles stays,
    // because those hold digits.
    letterSpacing: isRTL && role.letterSpacing > 0 ? '0px' : `${role.letterSpacing}px`,
    fontWeight: weight ?? role.weight,
    fontFamily: isMono ? 'var(--font-mono)' : undefined,
    textTransform: isCaps ? 'uppercase' : undefined,
    color: resolvedColor,
    fontVariantNumeric:
      tabular || resolvedVariant === 'metric' || isMono ? 'tabular-nums' : undefined,
    direction: isNumberRole ? 'ltr' : undefined,
    unicodeBidi: isNumberRole ? 'isolate' : undefined,
    textAlign: align,
    margin: 0,
    ...style,
  };

  return (
    <Component
      className={`${isCaps ? 'mono-caps ' : ''}${className}`.trim()}
      data-mono-caps={isCaps ? 'true' : undefined}
      style={computedStyle}
    >
      {children}
    </Component>
  );
}
