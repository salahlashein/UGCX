'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';
import { clampRange } from '../../utils/inputHelpers';

export interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  valueLow: number;
  valueHigh: number;
  onChange: (low: number, high: number) => void;
  band?: { low: number; high: number };
  className?: string;
}

export function RangeSlider({
  min,
  max,
  step = 100,
  valueLow,
  valueHigh,
  onChange,
  band,
  className = '',
}: RangeSliderProps) {
  const range = Math.max(1, max - min);
  const lowPct = Math.min(100, Math.max(0, ((valueLow - min) / range) * 100));
  const highPct = Math.min(100, Math.max(0, ((valueHigh - min) / range) * 100));

  const handleLowKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let nextLow = valueLow;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      nextLow = Math.max(min, valueLow - step);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      nextLow = Math.min(valueHigh, valueLow + step);
    } else {
      return;
    }
    e.preventDefault();
    const clamped = clampRange(nextLow, valueHigh, min, max);
    onChange(clamped.low, clamped.high);
  };

  const handleHighKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let nextHigh = valueHigh;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      nextHigh = Math.max(valueLow, valueHigh - step);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      nextHigh = Math.min(max, valueHigh + step);
    } else {
      return;
    }
    e.preventDefault();
    const clamped = clampRange(valueLow, nextHigh, min, max);
    onChange(clamped.low, clamped.high);
  };

  return (
    <div className={`flex flex-col gap-2 w-full py-2 ${className}`}>
      {/* Slider Track */}
      <div className="relative w-full h-8 flex items-center select-none">
        {/* Background Track */}
        <div
          className="w-full h-2 rounded-full"
          style={{ backgroundColor: colors.surfaceStrong }}
        />

        {/* Selected Range Highlight */}
        <div
          className="absolute h-2 rounded-full"
          style={{
            insetInlineStart: `${lowPct}%`,
            width: `${Math.max(0, highPct - lowPct)}%`,
            backgroundColor: colors.primary,
          }}
        />

        {/* Optional Band Highlight (e.g. recommended or average) */}
        {band ? (
          <div
            className="absolute h-2 rounded-full opacity-40 pointer-events-none"
            style={{
              insetInlineStart: `${Math.min(100, Math.max(0, ((band.low - min) / range) * 100))}%`,
              width: `${Math.max(0, ((band.high - band.low) / range) * 100)}%`,
              backgroundColor: colors.signaturePeach,
            }}
          />
        ) : null}

        {/* Low Handle */}
        <div
          role="slider"
          tabIndex={0}
          aria-valuemin={min}
          aria-valuemax={valueHigh}
          aria-valuenow={valueLow}
          aria-label="Minimum budget"
          onKeyDown={handleLowKey}
          className="absolute w-5 h-5 bg-white border-2 border-[#2f5d46] rounded-full shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2f5d46]/30 -translate-x-1/2 rtl:translate-x-1/2 z-10"
          style={{
            insetInlineStart: `${lowPct}%`,
          }}
        />

        {/* High Handle */}
        <div
          role="slider"
          tabIndex={0}
          aria-valuemin={valueLow}
          aria-valuemax={max}
          aria-valuenow={valueHigh}
          aria-label="Maximum budget"
          onKeyDown={handleHighKey}
          className="absolute w-5 h-5 bg-white border-2 border-[#2f5d46] rounded-full shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2f5d46]/30 -translate-x-1/2 rtl:translate-x-1/2 z-10"
          style={{
            insetInlineStart: `${highPct}%`,
          }}
        />
      </div>

      {/* Numerical Labels */}
      <div
        className="flex items-center justify-between text-xs"
        style={{
          fontFamily: 'var(--font-mono)',
          color: colors.muted,
        }}
      >
        <span>{min}</span>
        <span style={{ color: colors.primary, fontWeight: 500 }}>
          {valueLow} – {valueHigh}
        </span>
        <span>{max}</span>
      </div>
    </div>
  );
}
