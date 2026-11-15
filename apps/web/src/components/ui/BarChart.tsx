'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';
import { barAxis, barHeights } from '../../utils/dataHelpers';
import { centsToAmount } from '../../utils/money';
import { formatMoney } from '../../utils/format';

export interface BarDataPoint {
  label: string;
  valueCents: number;
}

export interface BarChartProps {
  data: BarDataPoint[];
  max?: number;
  highlightLast?: boolean;
  height?: number;
  className?: string;
}

export function BarChart({
  data,
  max,
  highlightLast = true,
  height = 140,
  className = '',
}: BarChartProps) {
  const values = data.map((d) => d.valueCents);
  const effectiveMax = max && max > 0 ? max : Math.max(...values, 100);
  const heights = barHeights(values, effectiveMax);
  const axis = barAxis(effectiveMax / 100);

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <div className="flex gap-3 items-end" style={{ height: `${height}px` }}>
        {/* Y-Axis Labels */}
        <div
          className="flex flex-col justify-between items-end shrink-0 py-1"
          style={{
            height: '100%',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: colors.muted,
          }}
        >
          <span>{axis[2]}</span>
          <span>{axis[1]}</span>
          <span>{axis[0]}</span>
        </div>

        {/* Bars Container */}
        <div
          className="grow flex items-end justify-between gap-2 h-full pb-1"
          style={{ borderBottom: `1px dashed ${colors.dashLine}` }}
        >
          {data.map((item, idx) => {
            const h = heights[idx] ?? 0;
            const isLast = idx === data.length - 1;
            const isHighlighted = highlightLast && isLast;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                {/* Tooltip on hover */}
                <div
                  className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 px-1.5 py-0.5 rounded pointer-events-none text-[10px] whitespace-nowrap z-10"
                  style={{
                    backgroundColor: colors.surfaceDark,
                    color: colors.onDark,
                    fontFamily: 'var(--font-mono)',
                    direction: 'ltr',
                    unicodeBidi: 'isolate',
                  }}
                >
                  {formatMoney(centsToAmount(item.valueCents))}
                </div>

                <div
                  style={{
                    width: '100%',
                    maxWidth: 36,
                    height: `${Math.max(4, h)}%`,
                    backgroundColor: isHighlighted ? colors.primary : colors.accentSoft,
                    borderRadius: `${radius.badge}px ${radius.badge}px 0 0`,
                    transition: 'height 0.3s ease',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-Axis Labels */}
      <div
        className="flex justify-between gap-2 ps-8"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: colors.muted,
        }}
      >
        {data.map((item, idx) => (
          <span key={idx} className="flex-1 text-center truncate">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
