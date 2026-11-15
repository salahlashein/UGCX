'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export interface RadioCardProps {
  selected: boolean;
  title: string;
  description?: string;
  icon?: IconName;
  onSelect: () => void;
  disabled?: boolean;
  className?: string;
}

export function RadioCard({
  selected,
  title,
  description,
  icon,
  onSelect,
  disabled = false,
  className = '',
}: RadioCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={handleKeyDown}
      className={`flex items-start justify-between gap-3 p-4 transition-all ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:border-black/20 active:scale-[0.99]'
      } ${className}`}
      style={{
        borderRadius: `${radius.card}px`,
        backgroundColor: colors.surface,
        border: `1.5px solid ${selected ? colors.primary : colors.hairline}`,
        boxShadow: selected ? elevation.card : 'none',
      }}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon ? (
          <div
            className="flex items-center justify-center shrink-0 mt-0.5"
            style={{
              width: 36,
              height: 36,
              borderRadius: `${radius.button}px`,
              backgroundColor: selected ? colors.accentSoft : colors.surfaceSoft,
            }}
          >
            <Icon name={icon} size={18} color={selected ? 'primary' : 'muted'} />
          </div>
        ) : null}
        <div className="flex flex-col min-w-0">
          <AppText variant="body" color="ink" style={{ fontWeight: selected ? 500 : 400 }}>
            {title}
          </AppText>
          {description ? (
            <AppText variant="caption" color="muted" style={{ marginTop: 2 }}>
              {description}
            </AppText>
          ) : null}
        </div>
      </div>

      {/* Radio Indicator */}
      <div
        className="flex items-center justify-center shrink-0 mt-0.5"
        style={{
          width: 20,
          height: 20,
          borderRadius: `${radius.full}px`,
          border: `2px solid ${selected ? colors.primary : colors.borderStrong}`,
        }}
      >
        {selected ? (
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: `${radius.full}px`,
              backgroundColor: colors.primary,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
