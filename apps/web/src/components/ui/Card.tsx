'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';

export interface CardProps {
  children: React.ReactNode;
  tone?: 'surface' | 'canvas' | 'soft' | 'dark';
  variant?: string;
  padding?: keyof typeof spacing | 'none';
  elevation?: string;
  header?: React.ReactNode;
  bleed?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({
  children,
  tone = 'surface',
  padding = 'md',
  elevation: _elevation,
  header,
  bleed = false,
  className = '',
  style,
  onClick,
}: CardProps) {
  const bgMap = {
    surface: colors.surface,
    canvas: colors.canvas,
    soft: colors.surfaceSoft,
    dark: colors.surfaceDark,
  };

  const padValue = bleed ? 0 : padding === 'none' ? 0 : spacing[padding];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={className}
      style={{
        backgroundColor: bgMap[tone],
        borderRadius: `${radius.card}px`,
        padding: `${padValue}px`,
        border: `1px solid ${tone === 'dark' ? colors.surfaceDarkElevated : colors.hairline}`,
        boxShadow: tone === 'surface' ? elevation.card : elevation.none,
        ...style,
      }}
    >
      {header ? (
        <div
          style={{
            padding: bleed ? `${spacing.md}px` : undefined,
            borderBottom: `1px dashed ${colors.dashLine}`,
            marginBottom: bleed ? 0 : `${spacing.md}px`,
          }}
        >
          {header}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export interface PressableCardProps extends CardProps {
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function PressableCard({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  tone = 'surface',
  padding = 'md',
  header,
  bleed = false,
  className = '',
  style,
}: PressableCardProps) {
  const bgMap = {
    surface: colors.surface,
    canvas: colors.canvas,
    soft: colors.surfaceSoft,
    dark: colors.surfaceDark,
  };
  const padValue = bleed ? 0 : padding === 'none' ? 0 : spacing[padding];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      className={`w-full text-start transition-transform duration-150 active:scale-[0.99] hover:opacity-95 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      style={{
        backgroundColor: bgMap[tone],
        borderRadius: `${radius.card}px`,
        padding: `${padValue}px`,
        border: `1px solid ${tone === 'dark' ? colors.surfaceDarkElevated : colors.hairline}`,
        boxShadow: tone === 'surface' ? elevation.card : elevation.none,
        ...style,
      }}
    >
      {header ? (
        <div
          style={{
            padding: bleed ? `${spacing.md}px` : undefined,
            borderBottom: `1px dashed ${colors.dashLine}`,
            marginBottom: bleed ? 0 : `${spacing.md}px`,
          }}
        >
          {header}
        </div>
      ) : null}
      {children}
    </div>
  );
}
