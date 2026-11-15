'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';
import { AppText } from './AppText';

export interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}: ToggleProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex items-center shrink-0 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{
          width: 44,
          height: 24,
          borderRadius: `${radius.full}px`,
          backgroundColor: checked ? colors.primary : colors.surfaceStrong,
          padding: 2,
        }}
      >
        <span
          className="inline-block rounded-full bg-white transition-transform duration-200 shadow-sm"
          style={{
            width: 20,
            height: 20,
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </button>
      {label ? (
        <span onClick={handleClick} className="cursor-pointer select-none">
          <AppText variant="body" color="ink">
            {label}
          </AppText>
        </span>
      ) : null}
    </div>
  );
}
