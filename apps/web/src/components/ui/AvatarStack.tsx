'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';

export interface AvatarPerson {
  initials: string;
  tone?: string;
}

export interface AvatarStackProps {
  people: AvatarPerson[];
  max?: number;
  size?: number;
  className?: string;
}

export function AvatarStack({ people, max = 3, size = 28, className = '' }: AvatarStackProps) {
  const visible = people.slice(0, max);
  const remaining = people.length - max;

  return (
    <div className={`flex items-center ${className}`}>
      {visible.map((p, idx) => (
        <div
          key={idx}
          className="flex items-center justify-center shrink-0 border-2 border-white text-white font-medium"
          style={{
            width: size,
            height: size,
            borderRadius: `${radius.full}px`,
            backgroundColor: p.tone ?? colors.primary,
            fontSize: `${Math.round(size * 0.4)}px`,
            marginInlineStart: idx > 0 ? `-${Math.round(size * 0.28)}px` : 0,
            zIndex: visible.length - idx,
          }}
        >
          {p.initials}
        </div>
      ))}
      {remaining > 0 ? (
        <div
          className="flex items-center justify-center shrink-0 border-2 border-white"
          style={{
            width: size,
            height: size,
            borderRadius: `${radius.full}px`,
            backgroundColor: colors.surfaceStrong,
            color: colors.muted,
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            marginInlineStart: `-${Math.round(size * 0.28)}px`,
            zIndex: 0,
          }}
        >
          +{remaining}
        </div>
      ) : null}
    </div>
  );
}
