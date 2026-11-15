'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';

export interface TagProps {
  children?: React.ReactNode;
  label?: React.ReactNode;
  tone?:
    | 'accent'
    | 'primary'
    | 'muted'
    | 'danger'
    | 'done'
    | 'live'
    | 'pend'
    | 'ok'
    | 'info'
    | 'bad'
    | 'neu';
  className?: string;
  style?: React.CSSProperties;
}

const TONE_STYLES = {
  accent: { border: colors.primary, color: colors.primary },
  primary: { border: colors.primary, color: colors.primary },
  done: { border: colors.primary, color: colors.primary },
  live: { border: colors.primary, color: colors.primary },
  ok: { border: colors.primary, color: colors.primary },
  pend: { border: colors.signaturePeach, color: colors.signaturePeach },
  info: { border: colors.info, color: colors.info },
  bad: { border: colors.danger, color: colors.danger },
  neu: { border: colors.dashLine, color: colors.muted },
  muted: { border: colors.dashLine, color: colors.muted },
  danger: { border: colors.danger, color: colors.danger },
};

export function Tag({ children, label, tone = 'primary', className = '', style }: TagProps) {
  const content = label ?? children;
  const toneStyle = TONE_STYLES[tone] ?? TONE_STYLES.primary;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap mono-caps ${className}`}
      data-mono-caps="true"
      style={{
        border: `1px dashed ${toneStyle.border}`,
        borderRadius: `${radius.badge}px`,
        color: toneStyle.color,
        paddingInline: '6px',
        paddingBlock: '2px',
        fontSize: '9.5px',
        lineHeight: '13px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        ...style,
      }}
    >
      {content}
    </span>
  );
}
