'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';
import { dueTone } from '../../utils/dataHelpers';
import { Icon } from './Icon';

export interface DueChipProps {
  dueAt: string | Date;
  now?: Date;
  className?: string;
}

export function DueChip({ dueAt, now, className = '' }: DueChipProps) {
  const tone = dueTone(dueAt, now);
  const target = typeof dueAt === 'string' ? new Date(dueAt) : dueAt;
  const current = now ?? new Date();
  const diffHours = Math.round((target.getTime() - current.getTime()) / (3600 * 1000));

  let label = '';
  if (diffHours < 0) {
    label = 'Overdue';
  } else if (diffHours < 24) {
    label = `${diffHours}h left`;
  } else {
    const days = Math.round(diffHours / 24);
    label = `${days}d left`;
  }

  const toneStyles = {
    hot: { bg: colors.dangerSurface, fg: colors.danger },
    warm: { bg: colors.signatureCream, fg: colors.signatureCoral },
    neu: { bg: colors.surfaceStrong, fg: colors.muted },
  };

  const { bg, fg } = toneStyles[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 mono-caps ${className}`}
      data-mono-caps="true"
      style={{
        backgroundColor: bg,
        color: fg,
        paddingInline: '7px',
        paddingBlock: '2.5px',
        borderRadius: `${radius.chip}px`,
        fontSize: '11px',
        lineHeight: '14px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
      }}
    >
      <Icon name="clock" size={12} color={tone === 'hot' ? 'danger' : 'muted'} />
      <span>{label}</span>
    </span>
  );
}
