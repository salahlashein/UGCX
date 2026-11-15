'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';

export interface FilterChipProps {
  label: string;
  selected?: boolean;
  count?: number;
  onClick?: () => void;
  onPress?: () => void;
}

export function FilterChip({ label, selected = false, count, onClick, onPress }: FilterChipProps) {
  const handlePress = onClick ?? onPress;

  return (
    <button
      type="button"
      onClick={handlePress}
      aria-pressed={selected}
      className="inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer"
      style={{
        paddingInline: `${spacing.md}px`,
        paddingBlock: `${spacing.xs}px`,
        borderRadius: `${radius.chip}px`,
        backgroundColor: selected ? colors.primary : colors.surface,
        color: selected ? colors.onPrimary : colors.body,
        border: `1px solid ${selected ? colors.primary : colors.hairline}`,
        fontSize: `${typography.caption.fontSize}px`,
        lineHeight: `${typography.caption.lineHeight}px`,
        fontWeight: typography.caption.weight,
      }}
    >
      <span>{label}</span>
      {typeof count === 'number' ? (
        <span
          className="tabular-nums"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            opacity: selected ? 0.9 : 0.7,
          }}
        >
          ({count})
        </span>
      ) : null}
    </button>
  );
}
