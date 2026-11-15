'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';
import { typography } from '../../theme/typography';

export interface GroupHeaderProps {
  label?: string;
  title?: string;
  count?: number;
  className?: string;
}

export function GroupHeader({ label, title, count, className = '' }: GroupHeaderProps) {
  const displayLabel = label ?? title ?? '';

  return (
    <div className={`flex items-center gap-2.5 py-2 ${className}`}>
      <span
        className="mono-caps shrink-0"
        data-mono-caps="true"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: `${typography.overlineMono.fontSize}px`,
          lineHeight: `${typography.overlineMono.lineHeight}px`,
          letterSpacing: `${typography.overlineMono.letterSpacing}px`,
          fontWeight: typography.overlineMono.weight,
          color: colors.muted,
          textTransform: 'uppercase',
        }}
      >
        {displayLabel}
      </span>
      {count !== undefined && count !== null ? (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            lineHeight: '14px',
            paddingInline: '5px',
            paddingBlock: '1px',
            borderRadius: `${radius.pill}px`,
            backgroundColor: colors.surfaceStrong,
            color: colors.muted,
          }}
        >
          {count}
        </span>
      ) : null}
      <div
        className="grow"
        style={{
          borderBottom: `1px dashed ${colors.dashLine}`,
          height: 1,
        }}
      />
    </div>
  );
}
