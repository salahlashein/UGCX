'use client';

import React from 'react';
import { colors, radius, sizes, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { Icon, type IconName } from './Icon';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  onPress?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'mint' | 'danger-outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  count?: number | string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Button({
  title,
  children,
  onClick,
  onPress,
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon,
  count,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  style,
}: ButtonProps) {
  const handlePress = onClick ?? onPress;
  const isDisabled = disabled || loading;

  const variantStyles: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
    primary: {
      backgroundColor: colors.primary,
      color: colors.onPrimary,
      border: `1px solid ${colors.primary}`,
    },
    secondary: {
      backgroundColor: colors.surface,
      color: colors.ink,
      border: `1px solid ${colors.borderStrong}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.primary,
      border: '1px solid transparent',
    },
    danger: {
      backgroundColor: colors.danger,
      color: colors.onPrimary,
      border: `1px solid ${colors.danger}`,
    },
    mint: {
      backgroundColor: colors.signatureMint,
      color: colors.surfaceDark,
      border: `1px solid ${colors.signatureMint}`,
    },
    'danger-outline': {
      backgroundColor: 'transparent',
      color: colors.danger,
      border: `1px solid ${colors.danger}`,
    },
  };

  const heights = {
    sm: 38,
    md: sizes.buttonHeight,
    lg: 52,
  };

  const iconColor =
    variant === 'primary' || variant === 'danger'
      ? 'onPrimary'
      : variant === 'mint'
        ? 'ink'
        : variant === 'danger-outline'
          ? 'danger'
          : 'primary';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (type !== 'submit') {
      e.stopPropagation();
    }
    handlePress?.();
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap transition-opacity duration-150 hover:opacity-90 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : 'shrink-0'} ${className}`}
      style={{
        minHeight: `${heights[size]}px`,
        paddingInline: `${spacing.md}px`,
        paddingBlock: `${spacing.xs}px`,
        borderRadius: `${radius.button}px`,
        fontSize: `${typography.button.fontSize}px`,
        lineHeight: `${typography.button.lineHeight}px`,
        fontWeight: typography.button.weight,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {loading ? (
        <span
          className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
          style={{ width: 18, height: 18 }}
          aria-hidden="true"
        />
      ) : icon ? (
        <Icon name={icon} size={18} color={iconColor} />
      ) : null}
      {/* A caller may pass an icon plus a label as children. Keep them on one
          row, so a narrow button never stacks the icon above the label. */}
      <span className="inline-flex items-center gap-2 whitespace-nowrap">{title ?? children}</span>
      {count !== undefined && count !== null ? (
        <span
          style={{
            paddingInline: '6px',
            paddingBlock: '1px',
            borderRadius: `${radius.pill}px`,
            fontSize: '11px',
            lineHeight: '14px',
            fontFamily: 'var(--font-mono)',
            backgroundColor: 'rgba(0, 0, 0, 0.12)',
            color: 'inherit',
          }}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
