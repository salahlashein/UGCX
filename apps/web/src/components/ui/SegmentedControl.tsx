'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';

export interface SegmentOption {
  value: string;
  label: string;
  count?: number;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (val: string) => void;
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  fullWidth = false,
  className = '',
}: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      className={`inline-flex items-center p-1 ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{
        backgroundColor: colors.surfaceSoft,
        borderRadius: `${radius.button}px`,
        border: `1px solid ${colors.hairline}`,
      }}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 transition-all cursor-pointer ${
              fullWidth ? 'flex-1' : ''
            }`}
            style={{
              borderRadius: `${radius.chip}px`,
              backgroundColor: isSelected ? colors.surface : 'transparent',
              color: isSelected ? colors.ink : colors.muted,
              boxShadow: isSelected ? elevation.card : 'none',
              fontWeight: isSelected ? 500 : 400,
              fontSize: '13px',
              lineHeight: '18px',
            }}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && opt.count !== null ? (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: isSelected ? colors.primary : colors.muted,
                  paddingInline: '4px',
                  borderRadius: `${radius.badge}px`,
                  backgroundColor: isSelected ? colors.accentSoft : 'transparent',
                }}
              >
                {opt.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
