'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';

export interface KbdProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Kbd({ children, className = '', style }: KbdProps) {
  return (
    <kbd
      // Hidden on touch screens, where there is no keyboard (UI audit G17).
      className={`ugcx-pointer-only inline-flex items-center justify-center font-mono ${className}`}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        lineHeight: '14px',
        fontWeight: 500,
        backgroundColor: colors.surfaceSoft,
        color: colors.ink,
        border: `1px solid ${colors.hairline}`,
        borderRadius: `${radius.badge}px`,
        paddingInline: '5px',
        paddingBlock: '1.5px',
        boxShadow: '0 1px 1px rgba(0,0,0,0.06)',
        ...style,
      }}
    >
      {children}
    </kbd>
  );
}
