'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';
import { meterWidths } from '../../utils/dataHelpers';
import type { StatusTone } from '../../utils/statusTone';

export interface MeterSegment {
  cents?: number;
  value?: number;
  tone?: StatusTone;
  color?: string;
  label?: string;
}

export interface MeterProps {
  segments: MeterSegment[];
  total?: number;
  max?: number;
  height?: number;
  className?: string;
}

const TONE_BAR_COLORS: Record<StatusTone, string> = {
  ok: colors.primary,
  pend: colors.signaturePeach,
  info: colors.info,
  bad: colors.danger,
  neu: colors.surfaceStrong,
};

export function Meter({ segments, total, max, height = 8, className = '' }: MeterProps) {
  const effectiveTotal = total ?? max ?? 0;
  const widths = meterWidths(segments, effectiveTotal);

  return (
    <div
      className={`w-full overflow-hidden flex ${className}`}
      style={{
        height: `${height}px`,
        borderRadius: `${radius.pill}px`,
        backgroundColor: colors.surfaceStrong,
      }}
    >
      {segments.map((seg, idx) => {
        const w = widths[idx] ?? 0;
        if (w <= 0) return null;
        const barColor = seg.color ?? (seg.tone ? TONE_BAR_COLORS[seg.tone] : colors.primary);

        return (
          <div
            key={idx}
            title={seg.label}
            style={{
              width: `${w}%`,
              backgroundColor: barColor,
              height: '100%',
              transition: 'width 0.3s ease',
            }}
          />
        );
      })}
    </div>
  );
}

export interface MiniBarProps {
  value: number;
  max: number;
  height?: number;
  tone?: 'primary' | 'danger' | 'info';
  className?: string;
}

export function MiniBar({
  value,
  max,
  height = 6,
  tone = 'primary',
  className = '',
}: MiniBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const barColor =
    tone === 'danger' ? colors.danger : tone === 'info' ? colors.info : colors.primary;

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={{
        height: `${height}px`,
        borderRadius: `${radius.pill}px`,
        backgroundColor: colors.surfaceStrong,
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          backgroundColor: barColor,
          height: '100%',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}
